import datetime
from flask import request, jsonify
from flask_login import login_required, current_user
from bson import ObjectId
from app.api import api_bp
from app.db import db
from app.utils import MAX_SIZE_NAME
from app.api.utils.helpers import safe_object_id, safe_float, safe_int, get_container_access
from app.api.utils.validators import validate_item_data


@api_bp.route("/container/<container_id>/items", methods=["GET"])
@login_required
def list_items_for_container(container_id):
    """
    List all items in a container
    ---
    tags:
      - Items
    security:
      - Session: []
    parameters:
      - name: container_id
        in: path
        type: string
        required: true
    responses:
      200:
        description: List of items
        schema:
          type: array
          items:
            type: object
            properties:
              _id:
                type: string
              name:
                type: string
              description:
                type: string
              value:
                type: number
              category:
                type: string
              condition:
                type: string
              owner:
                type: string
              tags:
                type: array
                items:
                  type: string
      401:
        description: Not authenticated
      403:
        description: Access denied
      404:
        description: Container not found
      500:
        description: Internal server error
    """
    try:
        container, container_id = get_container_access(container_id, current_user.id)
        if not container:
            return jsonify({"error": "Container not found"}), 404
        
        # Check if user has access (is member or admin)
        user_id = ObjectId(current_user.id)
        if user_id not in container["member_ids"]:
            return jsonify({"error": "Access denied"}), 403
        
        # Fetch items linked to this container
        items = list(db.items.find({"container_id": container_id}))
        
        # Convert ObjectIds & dates for JSON
        for item in items:
            item["_id"] = str(item["_id"])
            item["container_id"] = str(container_id)
            if "date_added" in item and item["date_added"]:
                item["date_added"] = item["date_added"].isoformat()
            
            # Get category name
            category = db.categories.find_one({"_id": item["category_id"]})
            item["category_id"] = ""
            item["category"] = category["name"]
        
        return jsonify(items), 200
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@api_bp.route("/container/<container_id>/item/add", methods=["GET", "POST"])
@login_required
def add_item(container_id):
    """
    Get item template or add new item
    ---
    tags:
      - Items
    security:
      - Session: []
    parameters:
      - name: container_id
        in: path
        type: string
        required: true
      - in: body
        name: body
        required: false
        schema:
          type: object
          required:
            - owner
            - name
            - value
            - category
          properties:
            owner:
              type: string
              example: "john_doe"
            name:
              type: string
              example: "Nintendo Switch"
              maxLength: 200
            serie:
              type: string
              maxLength: 5000
            description:
              type: string
              maxLength: 5000
            value:
              type: number
              example: 299.99
            date_created:
              type: string
              format: date
              example: "2024-01-15"
            location:
              type: string
              maxLength: 5000
            tags:
              type: array
              items:
                type: string
              maxItems: 50
            image_path:
              type: string
            category:
              type: string
              description: Category ID
            comment:
              type: string
              maxLength: 5000
            condition:
              type: string
              enum: ["New", "Very Good", "Good", "Used", "Damaged", "Heavily Damaged"]
            number:
              type: integer
              example: 1
            edition:
              type: string
              maxLength: 5000
    responses:
      200:
        description: Item template (GET request)
      201:
        description: Item created successfully (POST request)
      400:
        description: Invalid input
      401:
        description: Not authenticated
      403:
        description: Unauthorized access
      404:
        description: Category not found
    """
    container, container_id = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": "Unauthorized access to this container!"}), 403

    if request.method == "GET":
        template = {
            "owner": current_user.username,
            "name": "",
            "serie": "",
            "description": "",
            "value": 0.0,
            "date_created": "",
            "date_added": "",
            "location": "",
            "creator": "",
            "tags": [],
            "image_path": "",
            "category": "",
            "comment": "",
            "condition": "",
            "number": 1,
            "edition": "",
        }
        return jsonify(template), 200
    
    else:  # POST
        data = request.get_json()
        
        # Required fields check
        required_fields = ["owner", "name", "value", "category"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing fields"}), 400
        
        # Validate name
        item_name = data.get('name', '').strip()
        if not item_name or len(item_name) > MAX_SIZE_NAME:
            return jsonify({"error": f"Invalid item name length ({MAX_SIZE_NAME} characters maximum)"}), 400
        
        # Validate category
        category_id = safe_object_id(data.get('category'))
        if category_id is None:
            return jsonify({"error": "Invalid category ID"}), 400
        
        category = db.categories.find_one({
            "_id": category_id,
            "container_id": container_id
        })
        if not category:
            return jsonify({"error": "Category not found in this container"}), 404
        
        # Validate all item data
        error = validate_item_data(data)
        if error:
            return jsonify({"error": error}), 400

        item = {
            "container_id": container_id,
            "owner": data["owner"],
            "name": data["name"].strip(),
            "serie": data.get("serie", ""),
            "description": data.get("description", ""),
            "value": safe_float(data.get("value")),
            "date_created": data.get("date_created", ""),
            "date_added": datetime.datetime.now(datetime.timezone.utc),
            "location": data.get("location", ""),
            "creator": current_user.username,
            "tags": data.get("tags", []),
            "image_path": data.get("image_path", "not-image.png"),
            "category_id": category_id,
            "comment": data.get("comment", ""),
            "condition": data.get("condition", ""),
            "number": safe_int(data.get("number"), 1),
            "edition": data.get("edition", ""),
        }

        result = db.items.insert_one(item)
        return jsonify({"message": "Item added", "id": str(result.inserted_id)}), 201


@api_bp.route("/container/<container_id>/item/delete/<item_id>", methods=["DELETE"])
@login_required
def delete_item(container_id, item_id):
    """
    Delete an item
    ---
    tags:
      - Items
    security:
      - Session: []
    parameters:
      - name: container_id
        in: path
        type: string
        required: true
      - name: item_id
        in: path
        type: string
        required: true
    responses:
      200:
        description: Item deleted successfully
      400:
        description: Invalid item ID
      401:
        description: Not authenticated
      403:
        description: Unauthorized access
      404:
        description: Item not found
    """
    from pathlib import Path
    from app.utils import UPLOAD_FOLDER
    
    container, container_id = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": "Unauthorized access to this container!"}), 403
    
    item_id = safe_object_id(item_id)
    if not item_id:
        return jsonify({"error": "Invalid item ID"}), 400
    
    item = db.items.find_one_and_delete({
        "_id": item_id,
        "container_id": container["_id"]
    })
    if not item:
        return jsonify({"error": "Item not found"}), 404
    
    # Try to delete image if any
    if item.get('image_path'):
        try:
            image_path = Path(UPLOAD_FOLDER) / item['image_path']
            if image_path.exists() and image_path.is_file():
                image_path.unlink()
        except Exception as e:
            print(f"Failed to delete image: {e}")
    
    return jsonify({"message": "Item deleted successfully"}), 200


@api_bp.route("/container/<container_id>/item/update/<item_id>", methods=["GET"])
@login_required
def get_item_by_id(container_id, item_id):
    """
    Get item details for editing
    ---
    tags:
      - Items
    security:
      - Session: []
    parameters:
      - name: container_id
        in: path
        type: string
        required: true
      - name: item_id
        in: path
        type: string
        required: true
    responses:
      200:
        description: Item details
        schema:
          type: object
          properties:
            _id:
              type: string
            container_id:
              type: string
            name:
              type: string
            description:
              type: string
            value:
              type: number
            category_id:
              type: string
            # ... other fields
      400:
        description: Invalid item ID
      401:
        description: Not authenticated
      403:
        description: Unauthorized access
      404:
        description: Item not found
      500:
        description: Internal server error
    """
    container, container_id = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": "Unauthorized access to this container!"}), 403
    
    item_id = safe_object_id(item_id)
    if not item_id:
        return jsonify({"error": "Invalid item ID"}), 400

    try:
        item = db.items.find_one({"container_id": container_id, "_id": item_id})
        if not item:
            return jsonify({"error": "Item not found"}), 404

        item["_id"] = str(item["_id"])
        item["container_id"] = str(item["container_id"])
        item["category_id"] = str(item["category_id"])
        return jsonify(item), 200
    except Exception as e:
        print(f"Error fetching item: {e}")
        return jsonify({"error": "Failed to fetch item"}), 500


@api_bp.route("/container/<container_id>/item/update/<item_id>", methods=["POST"])
@login_required
def update_item(container_id, item_id):
    """
    Update an item
    ---
    tags:
      - Items
    security:
      - Session: []
    parameters:
      - name: container_id
        in: path
        type: string
        required: true
      - name: item_id
        in: path
        type: string
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            name:
              type: string
              maxLength: 200
            serie:
              type: string
              maxLength: 5000
            description:
              type: string
              maxLength: 5000
            value:
              type: number
            category:
              type: string
              description: Category ID
            condition:
              type: string
            owner:
              type: string
            tags:
              type: array
              items:
                type: string
              maxItems: 50
            # ... other fields
    responses:
      200:
        description: Item updated successfully
      400:
        description: Invalid input
      401:
        description: Not authenticated
      403:
        description: Unauthorized access
      404:
        description: Item or category not found
    """
    container, container_id = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": "Unauthorized access to this container!"}), 403

    data = request.get_json()
    
    # Validate item_id
    item_id = safe_object_id(item_id)
    if item_id is None:
        return jsonify({"error": "Invalid item ID"}), 400
    
    # Verify item exists
    item = db.items.find_one({"_id": item_id, "container_id": container_id})
    if item is None:
        return jsonify({"error": "Item not found in this container"}), 404
    
    # Validate category
    category_id = safe_object_id(data.get('category'))
    if category_id is None:
        return jsonify({"error": "Invalid category ID"}), 400
    
    category = db.categories.find_one({
        "_id": category_id,
        "container_id": container_id
    })
    if not category:
        return jsonify({"error": "Category not found in this container"}), 404
    
    # Validate item data
    error = validate_item_data(data)
    if error:
        return jsonify({"error": error}), 400
    
    update_fields = {
        "name": data.get("name"),
        "serie": data.get("serie"),
        "description": data.get("description"),
        "value": safe_float(data.get("value")),
        "date_created": data.get("date_created"),
        "location": data.get("location"),
        "tags": data.get("tags"),
        "creator": data.get("creator"),
        "category_id": category_id,
        "comment": data.get("comment"),
        "condition": data.get("condition"),
        "owner": data.get("owner"),
        "number": safe_int(data.get("number")),
        "edition": data.get("edition"),
    }
    
    image_path = data.get("image_path")
    if image_path:
        update_fields['image_path'] = image_path

    # Remove keys with None values
    update_fields = {k: v for k, v in update_fields.items() if v is not None}

    result = db.items.update_one(
        {"container_id": container_id, "_id": item_id},
        {"$set": update_fields}
    )

    if result.matched_count == 0:
        return jsonify({"message": "Item not found."}), 404

    return jsonify({"message": "Item updated successfully."}), 200