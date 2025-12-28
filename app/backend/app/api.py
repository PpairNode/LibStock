import os
import datetime
import secrets
from bson import ObjectId
from bson.errors import InvalidId
from pathlib import Path
from flask import request, jsonify, Blueprint, send_from_directory
from flask_login import login_required, current_user
from pymongo.errors import DuplicateKeyError
from werkzeug.utils import secure_filename
from app.db import db
from app.utils import UPLOAD_FOLDER



api_bp = Blueprint("api", __name__)


@api_bp.route("/user", methods=["GET"])
@login_required
def get_current_user():
    return jsonify({
        "username": current_user.username
    })


def safe_object_id(id_string):
    """Safely convert string to ObjectId"""
    try:
        return ObjectId(id_string)
    except (InvalidId, TypeError):
        return None


# TODO: upgrade error handling
def get_container_access(container_id: str, user_id):
    container_id = safe_object_id(container_id)
    if container_id is None:
        print(f"Unknown container ID: {container_id}!")
        return None, None
    container = db.containers.find_one({"_id": container_id})
    if not container:
        return None, None
    user_id = ObjectId(current_user.id)
    if user_id != container["admin_id"] and user_id not in container["member_ids"]:
        print(f"Unauthorized access detected from user ID: {user_id}!")
        return None, None
    return container, container_id


@api_bp.route("/containers", methods=["GET"])
@login_required
def list_containers():
    # Triage by current user
    user_id = ObjectId(current_user.id)
    containers = list(db.containers.find({ "member_ids": user_id }))
    for container in containers:
        container["_id"] = str(container["_id"])
        container["admin_id"] = str(container["admin_id"])
        container["member_ids"] = [str(uid) for uid in container["member_ids"]]
    return jsonify(containers), 200


@api_bp.route("/container/<container_id>/categories", methods=["GET"])
@login_required
def list_categories(container_id):
    container, container_id = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": f"Unauthorized access to this container!"}), 403
    
    categories = list(db.categories.find({ "container_id": container["_id"] }))
    for cat in categories:
        cat["_id"] = str(cat["_id"])  # Convert ObjectId to string
        cat["container_id"] = str(cat["container_id"])
    return jsonify(categories), 200


@api_bp.route("/container/<container_id>/category/add", methods=["POST"])
@login_required
def add_category(container_id):
    container, container_id = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": f"Unauthorized access to this container!"}), 403

    data = request.get_json()
    required_fields = ["name"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing fields"}), 400
    category_name = data["name"].strip().upper()
    category = {
        "name": category_name,
        "container_id": container_id
    }
    try:
        result = db.categories.insert_one(category)
    except DuplicateKeyError:
        return jsonify({ "error": "Category already exists" }), 409
    return jsonify({ "message": "Category added", "id": str(result.inserted_id) }), 201


@api_bp.route("/container/<container_id>/category/update/<category_id>", methods=["POST"])
@login_required
def update_category(container_id, category_id):
    container, container_id = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": f"Unauthorized access to this container!"}), 403

    data = request.get_json()

    category_id = safe_object_id(category_id)
    if category_id is None:
        return jsonify({"error": "Invalid category ID"}), 400

    required_fields = ["name"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing fields"}), 400
    
    result = db.categories.update_one(
        {"_id": category_id, "container_id": container_id},
        {"$set": {"name": data["name"]}}
    )
    if result.matched_count == 0:
        return jsonify({"error": "Category not found"}), 404
    
    return jsonify({"message": "Category updated successfully"}), 201


@api_bp.route("/container/<container_id>/category/delete/<category_id>", methods=["DELETE"])
@login_required
def delete_category(container_id, category_id):
    container, container_id = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": f"Unauthorized access to this container!"}), 403
    category_id = safe_object_id(category_id)
    if category_id is None:
        return jsonify({"error": "Invalid category ID"}), 400
    
    # Delete all items which are contained in this category
    db.items.delete_many({"container_id": container_id, "category_id": category_id})
    result = db.categories.delete_one({ "container_id": container_id,  "_id": category_id})
    if result.deleted_count == 1:
        return jsonify({"message": "Category deleted successfully"}), 200
    else:
        return jsonify({"message": "Category not found"}), 404


@api_bp.route("/container/<container_id>/items", methods=["GET"])
@login_required
def list_items_for_container(container_id):
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
            category = db.categories.find_one({ "_id": item["category_id"]})
            item["category_id"] = ""
            item["category"] = category["name"]
        return jsonify(items), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_bp.route("/container/add", methods=["POST"])
@login_required
def add_container():
    data = request.get_json()
    required_fields = ["name"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing fields"}), 400
    container_name = data["name"].strip()
    user_id = safe_object_id(current_user.id)
    if not user_id:
        return jsonify({"error": "User not found"}), 404

    # Enforce unique container name per admin
    existing = db.containers.find_one({
        "name": container_name,
        "admin_id": user_id
    })
    if existing:
        return jsonify({"error": "Container already exists"}), 409

    container = {
        "name": container_name,
        "admin_id": user_id,
        "member_ids": [user_id],
    }

    try:
        result = db.containers.insert_one(container)
    except DuplicateKeyError:
        return jsonify({"error": "Container already exists"}), 409

    return jsonify({ "message": "Container added", "id": str(result.inserted_id) }), 201


@api_bp.route("/container/delete/<container_id>", methods=["DELETE"])
@login_required
def delete_container(container_id):
    container, container_id = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": f"Unauthorized access to this container!"}), 403

    # Delete all items and categories belonging to this container
    db.items.delete_many({"container_id": container_id})
    db.categories.delete_many({"container_id": container_id})
    result = db.containers.delete_one({"_id": container["_id"]})
    if result.deleted_count == 1:
        return jsonify({"message": "Container deleted successfully"}), 200
    else:
        return jsonify({"error": "Container not found"}), 404


@api_bp.route("/container/update/<container_id>", methods=["POST"])
@login_required
def update_container(container_id):
    container, container_id = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": f"Unauthorized access to this container!"}), 403

    data = request.get_json()

    required_fields = ["name"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing fields"}), 400
    
    result = db.containers.update_one(
        {"_id": container_id},
        {"$set": {"name": data["name"]}}
    )
    if result.matched_count == 0:
        return jsonify({"error": "Container not found"}), 404
    
    return jsonify({"message": "Container updated successfully"}), 201


@api_bp.route("/container/<container_id>", methods=["GET"])
@login_required
def get_container(container_id):
    container, container_id = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": f"Unauthorized access to this container!"}), 403

    # Convert ObjectIds to strings for JSON
    container["_id"] = str(container["_id"])
    if "admin_id" in container:
        container["admin_id"] = str(container["admin_id"])
    if "member_ids" in container:
        container["member_ids"] = [str(x) for x in container["member_ids"]]
    return container, 200


@api_bp.route("/container/<container_id>/item/add", methods=["GET", "POST"])
@login_required
def add_item(container_id):
    container, container_id = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": f"Unauthorized access to this container!"}), 403

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

        required_fields = ["owner", "name", "value", "category"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing fields"}), 400
        
        category_id = safe_object_id(data.get('category'))
        if category_id is None:
            return jsonify({"error": "Invalid category ID"}), 400
        result = db.categories.find({"_id": category_id})
        if result is None:
            return jsonify({"error": "Invalid category"}), 400

        item = {
            "container_id": ObjectId(container_id),
            "owner": data["owner"],
            "name": data["name"],
            "serie": data["serie"],
            "description": data["description"] or "",
            "value": safe_float(data["value"]),
            "date_created": data["date_created"] or "",
            "date_added": datetime.datetime.now(datetime.timezone.utc),
            "location": data["location"] or "",
            "creator": current_user.username,
            "tags": data["tags"],
            "image_path": data["image_path"] or "not-image.png",
            "category_id": category_id,
            "comment": data["comment"] or "",
            "condition": data["condition"] or "",
            "number": safe_int(data["number"]),
            "edition": data["edition"] or "",
        }

        result = db.items.insert_one(item)
        return jsonify({ "message": "Item added", "id": str(result.inserted_id) }), 201
    

@api_bp.route('/media/<filename>')
def media(filename):
    try:
        resp = send_from_directory(str(Path(UPLOAD_FOLDER)), filename)
        return resp
    except Exception as e:
        print(f"Error in send_from_directory: {e}")
        return jsonify({"error": "File not found"}), 404


# File upload config
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}
def allowed_rename_file(filename) -> str | None:
    if '.' in filename:
        extension = filename.rsplit('.', 1)[1].lower()
        if extension in ALLOWED_EXTENSIONS:
            return secrets.token_hex() + '.' + extension
    return None

@api_bp.route('/upload/image', methods=['POST'])
@login_required
def upload_image():
    file = request.files.get('image')
    if not file:
        return jsonify({"error": "Invalid image file"}), 400
    new_name = allowed_rename_file(file.filename)
    if new_name is None:
        return jsonify({"error": "Invalid image extension"}), 400

    filename = secure_filename(new_name)
    path = Path(UPLOAD_FOLDER) / filename
    full_path = str(path)
    file.save(full_path)
    return jsonify({"image_path": filename}), 200


@api_bp.route("/container/<container_id>/item/delete/<item_id>", methods=["DELETE"])
@login_required
def delete_item(container_id, item_id):
    container, container_id = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": f"Unauthorized access to this container!"}), 403
    
    item_id = safe_object_id(item_id)
    if not item_id:
        return jsonify({"error": "Invalid item ID"}), 400
    
    result = db.items.find_one_and_delete({
        "_id": item_id,
        "container_id": container["_id"]
    })
    if not result:
        return jsonify({"error": "Item not found"}), 404
    # Try to delete image if any
    if result.get('image_path'):
        try:
            image_path = Path(UPLOAD_FOLDER) / result['image_path']
            if image_path.exists() and image_path.is_file():
                image_path.unlink()
        except Exception as e:
            print(f"Failed to delete image: {e}")
    return jsonify({"message": "Item deleted successfully"}), 200

    
@api_bp.route("/container/<container_id>/item/update/<item_id>", methods=["GET"])
@login_required
def get_item_by_id(container_id, item_id):
    container, container_id = get_container_access(container_id, current_user.id)
    if not container:
        print("Container access denied")
        return jsonify({"error": "Unauthorized access to this container!"}), 403
    
    try:
        item = db.items.find_one({"container_id": container_id, "_id": ObjectId(item_id)})
        if not item:
            print("Item not found in database")
            return jsonify({"message": "Item not found"}), 404

        item["_id"] = str(item["_id"])
        item["container_id"] = str(item["container_id"])
        item["category_id"] = str(item["category_id"])
        return jsonify(item), 200
    except Exception as e:
        return jsonify({"message": f"Failed to fetch item"}), 500


def safe_float(value, default=0.0):
    try:
        return round(float(value), 2)
    except (ValueError, TypeError):
        return default
    
def safe_int(value, default=0):
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


@api_bp.route("/container/<container_id>/item/update/<id>", methods=["POST"])
@login_required
def update_item(container_id, id):
    container, container_id = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": f"Unauthorized access to this container!"}), 403

    data = request.json
    # Validate fields here as needed
    category_id = safe_object_id(data.get('category'))
    if category_id is None:
        return jsonify({"error": "Invalid category ID"}), 400
    item_id = safe_object_id(id)
    if item_id is None:
        return jsonify({"error": "Invalid item ID"}), 400
    result = db.items.find({ "_id": item_id })
    if result is None:
        return jsonify({"error": "Invalid item ID"}), 400
    
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
    print(f"Image path: {image_path}")
    if image_path:
        update_fields['image_path'] = image_path

    # Remove keys with None values (optional)
    update_fields = {k: v for k, v in update_fields.items() if v is not None}

    result = db.items.update_one(
        { "container_id": container_id, "_id": item_id },
        { "$set": update_fields }
    )

    if result.matched_count == 0:
        return jsonify({ "message": "Item not found." }), 404

    return jsonify({ "message": "Item updated successfully." }), 200