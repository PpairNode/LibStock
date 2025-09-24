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


@api_bp.route('/media/<filename>')
def media(filename):
    try:
        resp = send_from_directory(str(Path(UPLOAD_FOLDER)), filename)
        return resp
    except Exception as e:
        print(f"Error in send_from_directory: {e}")
        return jsonify({"error": "File not found"}), 404


@api_bp.route("/item/add", methods=["GET", "POST"])
@login_required
def add_item():
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


@api_bp.route("/item/delete", methods=["DELETE"])
@login_required
def delete_item():
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
    

@api_bp.route("/item/update/<id>", methods=["GET"])
@login_required
def get_item_by_id(id):
    try:
        item = db.items.find_one({"_id": ObjectId(id)})
        if not item:
            return jsonify({"message": "Item not found"}), 404

        item["_id"] = str(item["_id"])
        return jsonify(item), 200
    except Exception as e:
        return jsonify({"message": "Failed to fetch item"}), 500


@api_bp.route("/item/update/<id>", methods=["POST"])
@login_required
def update_item(id):
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
        { "_id": ObjectId(id) },
        { "$set": update_fields }
    )

    if result.matched_count == 0:
        return jsonify({ "message": "Item not found." }), 404

    return jsonify({ "message": "Item updated successfully." }), 200