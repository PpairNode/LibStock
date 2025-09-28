import os
import datetime
import secrets
from bson import ObjectId
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

def check_ressource_auth():
    # TODO: check current DB of user / maybe add max DB (20)?
    pass


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


@api_bp.route("/categories", methods=["GET"])
@login_required
def list_categories():
    categories = list(db.categories.find({}))
    for cat in categories:
        cat["_id"] = str(cat["_id"])  # Convert ObjectId to string
    return jsonify(categories), 200


@api_bp.route("/category/add", methods=["GET", "POST"])
@login_required
def add_category():
    if request.method == "GET":
        template = {
            "name": "",
        }
        return jsonify(template), 200
    else:  # POST
        data = request.get_json()
        required_fields = ["name"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing fields"}), 400
        category_name = data["name"].strip().upper()
        item = { "name": category_name }
        try:
            result = db.categories.insert_one(item)
        except DuplicateKeyError:
            return jsonify({ "error": "Category already exists" }), 409
        return jsonify({ "message": "Category added", "id": str(result.inserted_id) }), 201


@api_bp.route("/category/delete", methods=["DELETE"])
@login_required
def delete_category():
    data = request.get_json()
    item_id = data.get("id")
    if not item_id:
        return jsonify({"message": "Item ID is required"}), 400
    result = db.categories.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 1:
        return jsonify({"message": "Item deleted successfully"}), 200
    else:
        return jsonify({"message": "Item not found"}), 404


@api_bp.route("/items", methods=["GET"])
@login_required
def list_items():
    items = list(db.items.find({}))
    for item in items:
        item["_id"] = str(item["_id"])  # Convert ObjectId to string
        item["date_added"] = item["date_added"].isoformat() if "date_added" in item else None
    return jsonify(items), 200


@api_bp.route("/containers/<container_id>/items", methods=["GET"])
@login_required
def list_items_for_container(container_id):
    try:
        container = db.containers.find_one({"_id": ObjectId(container_id)})
        if not container:
            return jsonify({"error": "Container not found"}), 404
        # Check if user has access (is member or admin)
        user_id = ObjectId(current_user.id)
        if user_id not in container["member_ids"]:
            return jsonify({"error": "Access denied"}), 403
        # Fetch items linked to this container
        items = list(db.items.find({"container_id": ObjectId(container_id)}))
        # Convert ObjectIds & dates for JSON
        for item in items:
            item["_id"] = str(item["_id"])
            item["container_id"] = str(item["container_id"])
            if "date_added" in item and item["date_added"]:
                item["date_added"] = item["date_added"].isoformat()
        return jsonify(items), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_bp.route("/container/add", methods=["GET", "POST"])
@login_required
def add_container():
    if request.method == "GET":
        template = {
            "name": "",
        }
        return jsonify(template), 200

    else:  # POST
        data = request.get_json()
        required_fields = ["name"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing fields"}), 400
        container_name = data["name"].strip()
        user_id = ObjectId(current_user.id)

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


# TODO: upgrade error handling
def get_container_access(container_id: str, user_id):
    container = db.containers.find_one({"_id": ObjectId(container_id)})
    if not container:
        return None
    user_id = ObjectId(current_user.id)
    print(f"CONT: {container}")
    print(f"USER ID: {user_id}")
    if user_id != container["admin_id"] and user_id not in container["member_ids"]:
        print(f"Unauthorized access detected from user ID: {user_id}!")
        return None
    return container


@api_bp.route("/container/delete", methods=["DELETE"])
@login_required
def delete_container():
    data = request.get_json()
    _id = data.get("id")
    if not _id:
        return jsonify({"message": "Container ID is required"}), 400
    container = get_container_access(_id, current_user.id)
    if not container:
        return jsonify({"error": f"Unauthorized access to this container!"}), 403

    # Delete all items belonging to this container
    db.items.delete_many({"container_id": container["_id"]})
    result = db.containers.delete_one({"_id": container["_id"]})
    if result.deleted_count == 1:
        return jsonify({"message": "Container deleted successfully"}), 200
    else:
        return jsonify({"error": "Container not found"}), 404


@api_bp.route("/container/<container_id>", methods=["GET"])
@login_required
def get_container(container_id):
    container = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": f"Unauthorized access to this container!"})

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
    container = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": f"Unauthorized access to this container!"})

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

        item = {
            "container_id": ObjectId(container_id),
            "owner": data["owner"],
            "name": data["name"],
            "serie": data["serie"],
            "description": data["description"] or "",
            "value": round(float(data["value"]) or 0),
            "date_created": data["date_created"] or "",
            "date_added": datetime.datetime.now(datetime.timezone.utc),
            "location": data["location"] or "",
            "creator": current_user.username,
            "tags": data["tags"],
            "image_path": data["image_path"] or "not-image.png",
            "category": data["category"] or "",
            "comment": data["comment"] or "",
            "condition": data["condition"] or "",
            "number": data["number"] or 0,
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
    return jsonify({"image_path": full_path}), 200


@api_bp.route("/container/<container_id>/item/delete", methods=["DELETE"])
@login_required
def delete_item(container_id):
    container = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": f"Unauthorized access to this container!"})
    
    data = request.get_json()
    item_id = data.get("id")
    if not item_id:
        return jsonify({"message": "Item ID is required"}), 400
    obj_id = ObjectId(str(item_id))
    item = db.items.find_one({"_id": obj_id})
    result = db.items.delete_one({"_id": obj_id})
    # Try to delete image if any
    image_path = item['image_path']
    if image_path:
        print(f"Deleting image {image_path}!")
        old_image_path = item["image_path"]
        if old_image_path:
            print(f"Old Image Path: {old_image_path}")
            old_image_path = Path(UPLOAD_FOLDER) / old_image_path
            if old_image_path.exists() and old_image_path.is_file():
                print(f"Image Deleted: {old_image_path}")
                old_image_path.unlink()
    # Check result
    if result.deleted_count == 1:
        return jsonify({"message": "Item deleted successfully"}), 200
    else:
        return jsonify({"message": "Item not found"}), 404
    

@api_bp.route("/container/<container_id>/item/update/<item_id>", methods=["GET"])
@login_required
def get_item_by_id(container_id, item_id):
    container = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": f"Unauthorized access to this container!"})
    
    try:
        item = db.items.find_one({"container_id": ObjectId(container_id), "_id": ObjectId(item_id)})
        if not item:
            return jsonify({"message": "Item not found"}), 404

        item["_id"] = str(item["_id"])
        item["container_id"] = str(item["container_id"])
        return jsonify(item), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "Failed to fetch item"}), 500


@api_bp.route("/container/<container_id>/item/update/<id>", methods=["POST"])
@login_required
def update_item(container_id, id):
    container = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": f"Unauthorized access to this container!"})

    data = request.json
    # Validate fields here as needed
    update_fields = {
        "name": data.get("name"),
        "serie": data.get("serie"),
        "description": data.get("description"),
        "value": round(float(data.get("value") or 0), 2),
        "date_created": data.get("date_created"),
        "location": data.get("location"),
        "tags": data.get("tags"),
        "creator": data.get("creator"),
        "category": data.get("category"),
        "comment": data.get("comment"),
        "condition": data.get("condition"),
        "owner": data.get("owner"),
        "number": data.get("number"),
        "edition": data.get("edition"),
    }
    image_path = data.get("image_path")
    print(f"Image path: {image_path}")
    if image_path:
        update_fields['image_path'] = image_path

    # Remove keys with None values (optional)
    update_fields = {k: v for k, v in update_fields.items() if v is not None}

    result = db.items.update_one(
        { "container_id": ObjectId(container_id), "_id": ObjectId(id) },
        { "$set": update_fields }
    )

    if result.matched_count == 0:
        return jsonify({ "message": "Item not found." }), 404

    return jsonify({ "message": "Item updated successfully." }), 200