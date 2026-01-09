import datetime
import json
import base64
from pathlib import Path
from flask import request, jsonify, send_file
from flask_login import login_required, current_user
from bson import ObjectId
from io import BytesIO
from app.api import api_bp
from app.db import db
from app.utils import UPLOAD_FOLDER
from app.api.utils.helpers import safe_object_id, get_container_access

EXPORT_VERSION = "1.0"


@api_bp.route("/export/containers", methods=["POST"])
@login_required
def export_containers():
    """
    Export selected containers with all their data
    ---
    tags:
      - Export/Import
    security:
      - Session: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            container_ids:
              type: array
              items:
                type: string
              description: List of container IDs to export
            include_images:
              type: boolean
              description: Whether to include images as base64
              default: true
    responses:
      200:
        description: JSON export file
        content:
          application/json:
            schema:
              type: object
      400:
        description: Invalid input
      403:
        description: Unauthorized access to container
    """
    data = request.get_json()
    container_ids = data.get("container_ids", [])
    include_images = data.get("include_images", True)
    
    if not container_ids:
        return jsonify({"error": "No containers selected"}), 400
    
    export_data = {
        "version": EXPORT_VERSION,
        "export_date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "containers": []
    }
    
    for idx, container_id_str in enumerate(container_ids):
        container, container_id = get_container_access(container_id_str, current_user.id)
        if not container:
            return jsonify({"error": f"Unauthorized access to container {container_id_str}"}), 403
        
        # Create temporary ID for this container
        container_temp_id = f"container_{idx + 1}"
        
        # Export container
        container_export = {
            "temp_id": container_temp_id,
            "name": container["name"],
            "categories": [],
            "items": []
        }
        
        # Map ObjectId to temp_id for categories
        category_id_map = {}
        
        # Export categories
        categories = list(db.categories.find({"container_id": container_id}))
        for cat_idx, category in enumerate(categories):
            category_temp_id = f"category_{idx + 1}_{cat_idx + 1}"
            category_id_map[str(category["_id"])] = category_temp_id
            
            container_export["categories"].append({
                "temp_id": category_temp_id,
                "name": category["name"]
            })
        
        # Export items
        items = list(db.items.find({"container_id": container_id}))
        for item in items:
            item_export = {
                "category_temp_id": category_id_map.get(str(item["category_id"])),
                "name": item.get("name"),
                "owner": item.get("owner"),
                "serie": item.get("serie"),
                "description": item.get("description"),
                "value": item.get("value"),
                "date_created": item.get("date_created"),
                "location": item.get("location"),
                "creator": item.get("creator"),
                "tags": item.get("tags", []),
                "comment": item.get("comment"),
                "condition": item.get("condition"),
                "number": item.get("number"),
                "edition": item.get("edition"),
                "image_path": item.get("image_path")
            }
            
            # Include image as base64 if requested
            if include_images and item.get("image_path"):
                try:
                    image_path = Path(UPLOAD_FOLDER) / item["image_path"]
                    if image_path.exists() and image_path.is_file():
                        with open(image_path, "rb") as img_file:
                            image_data = base64.b64encode(img_file.read()).decode('utf-8')
                            item_export["image_data"] = image_data
                            item_export["image_extension"] = image_path.suffix
                except Exception as e:
                    print(f"Failed to encode image: {e}")
            
            container_export["items"].append(item_export)
        
        export_data["containers"].append(container_export)
    
    # Create JSON file
    json_data = json.dumps(export_data, indent=2, ensure_ascii=False)
    
    # Return as downloadable file
    buffer = BytesIO()
    buffer.write(json_data.encode('utf-8'))
    buffer.seek(0)
    
    filename = f"libstock_export_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    return send_file(
        buffer,
        as_attachment=True,
        download_name=filename,
        mimetype='application/json'
    )


@api_bp.route("/import/containers", methods=["POST"])
@login_required
def import_containers():
    """
    Import containers from JSON file
    ---
    tags:
      - Export/Import
    security:
      - Session: []
    consumes:
      - multipart/form-data
    parameters:
      - name: file
        in: formData
        type: file
        required: true
        description: JSON export file
      - name: conflict_strategy
        in: formData
        type: string
        enum: [skip, rename, replace]
        default: rename
        description: How to handle container name conflicts
    responses:
      201:
        description: Import successful
        schema:
          type: object
          properties:
            message:
              type: string
            imported_containers:
              type: array
              items:
                type: object
      400:
        description: Invalid file or data
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    conflict_strategy = request.form.get('conflict_strategy', 'rename')
    
    try:
        # Parse JSON
        import_data = json.load(file)
        
        # Validate version
        if import_data.get("version") != EXPORT_VERSION:
            return jsonify({"error": f"Unsupported export version. Expected {EXPORT_VERSION}"}), 400
        
        user_id = ObjectId(current_user.id)
        imported_containers = []
        
        # Process each container
        for container_data in import_data.get("containers", []):
            container_name = container_data["name"]
            
            # Handle name conflicts
            if conflict_strategy == "skip":
                existing = db.containers.find_one({"name": container_name, "admin_id": user_id})
                if existing:
                    continue
            elif conflict_strategy == "rename":
                counter = 1
                original_name = container_name
                while db.containers.find_one({"name": container_name, "admin_id": user_id}):
                    container_name = f"{original_name} ({counter})"
                    counter += 1
            elif conflict_strategy == "replace":
                existing = db.containers.find_one({"name": container_name, "admin_id": user_id})
                if existing:
                    # Delete existing container and all its data
                    db.items.delete_many({"container_id": existing["_id"]})
                    db.categories.delete_many({"container_id": existing["_id"]})
                    db.containers.delete_one({"_id": existing["_id"]})
            
            # Create new container
            new_container = {
                "name": container_name,
                "admin_id": user_id,
                "member_ids": [user_id]
            }
            container_result = db.containers.insert_one(new_container)
            new_container_id = container_result.inserted_id
            
            # Map temp_id to real ObjectId for categories
            category_id_map = {}
            
            # Import categories
            for category_data in container_data.get("categories", []):
                new_category = {
                    "name": category_data["name"],
                    "container_id": new_container_id
                }
                category_result = db.categories.insert_one(new_category)
                category_id_map[category_data["temp_id"]] = category_result.inserted_id
            
            # Import items
            for item_data in container_data.get("items", []):
                category_id = category_id_map.get(item_data.get("category_temp_id"))
                if not category_id:
                    continue  # Skip items with invalid category
                
                # Handle image import
                image_path = None
                if item_data.get("image_data"):
                    try:
                        import secrets
                        # Decode base64 image
                        image_bytes = base64.b64decode(item_data["image_data"])
                        
                        # Generate new filename
                        extension = item_data.get("image_extension", ".png")
                        new_filename = secrets.token_hex(16) + extension
                        image_path = Path(UPLOAD_FOLDER) / new_filename
                        
                        # Save image
                        with open(image_path, "wb") as img_file:
                            img_file.write(image_bytes)
                        
                        image_path = new_filename
                    except Exception as e:
                        print(f"Failed to import image: {e}")
                        image_path = item_data.get("image_path", "not-image.png")
                else:
                    image_path = item_data.get("image_path", "not-image.png")
                
                # Create new item
                new_item = {
                    "container_id": new_container_id,
                    "category_id": category_id,
                    "name": item_data.get("name"),
                    "owner": item_data.get("owner"),
                    "serie": item_data.get("serie", ""),
                    "description": item_data.get("description", ""),
                    "value": item_data.get("value", 0.0),
                    "date_created": item_data.get("date_created", ""),
                    "date_added": datetime.datetime.now(datetime.timezone.utc),
                    "location": item_data.get("location", ""),
                    "creator": current_user.username,
                    "tags": item_data.get("tags", []),
                    "image_path": image_path,
                    "comment": item_data.get("comment", ""),
                    "condition": item_data.get("condition", ""),
                    "number": item_data.get("number", 1),
                    "edition": item_data.get("edition", "")
                }
                db.items.insert_one(new_item)
            
            imported_containers.append({
                "name": container_name,
                "id": str(new_container_id),
                "categories_count": len(container_data.get("categories", [])),
                "items_count": len(container_data.get("items", []))
            })
        
        return jsonify({
            "message": "Import successful",
            "imported_containers": imported_containers
        }), 201
        
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON file"}), 400
    except Exception as e:
        print(f"Import error: {e}")
        return jsonify({"error": f"Import failed: {str(e)}"}), 500


@api_bp.route("/export/preview", methods=["POST"])
@login_required
def preview_export():
    """
    Preview export data (without creating file)
    ---
    tags:
      - Export/Import
    security:
      - Session: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            container_ids:
              type: array
              items:
                type: string
    responses:
      200:
        description: Export preview
        schema:
          type: object
          properties:
            containers:
              type: array
              items:
                type: object
                properties:
                  name:
                    type: string
                  categories_count:
                    type: integer
                  items_count:
                    type: integer
                  total_size_mb:
                    type: number
    """
    data = request.get_json()
    container_ids = data.get("container_ids", [])
    
    if not container_ids:
        return jsonify({"error": "No containers selected"}), 400
    
    preview_data = []
    
    for container_id_str in container_ids:
        container, container_id = get_container_access(container_id_str, current_user.id)
        if not container:
            continue
        
        categories_count = db.categories.count_documents({"container_id": container_id})
        items_count = db.items.count_documents({"container_id": container_id})
        
        # Estimate size
        items = list(db.items.find({"container_id": container_id}, {"image_path": 1}))
        total_size = 0
        for item in items:
            if item.get("image_path"):
                try:
                    image_path = Path(UPLOAD_FOLDER) / item["image_path"]
                    if image_path.exists():
                        total_size += image_path.stat().st_size
                except:
                    pass
        
        preview_data.append({
            "id": str(container_id),
            "name": container["name"],
            "categories_count": categories_count,
            "items_count": items_count,
            "total_size_mb": round(total_size / (1024 * 1024), 2)
        })
    
    return jsonify({"containers": preview_data}), 200
