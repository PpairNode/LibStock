import datetime
from bson import ObjectId
from flask import request, jsonify
from flask_login import login_required, current_user
from __main__ import app, db



@app.route("/")
def hello():
    print("Route triggered: hello")
    return jsonify({
        "message": "Hello from Flask!",
        "status": "OK"
    }), 200


@app.route("/api/user", methods=["GET"])
@login_required
def get_current_user():
    return jsonify({
        "username": current_user.username
    })


@app.route("/api/categories", methods=["GET"])
@login_required
def list_categories():
    categories = list(db.categories.find())
    for cat in categories:
        cat["_id"] = str(cat["_id"])  # Convert ObjectId to string
    return jsonify(categories), 200


@app.route("/api/category/add", methods=["GET", "POST"])
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

        item = {
            "name": data["name"]
        }

        result = db.categories.insert_one(item)
        return jsonify({ "message": "Category added", "id": str(result.inserted_id) }), 201


@app.route("/api/category/delete", methods=["DELETE"])
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


@app.route("/api/dashboard", methods=["GET"])
@login_required
def dashboard():
    return jsonify({
        "message": f"Welcome {current_user.username}!",
        "username": current_user.username
    }), 200


@app.route("/api/items", methods=["GET"])
@login_required
def list_items():
    items = list(db.items.find())
    for item in items:
        item["_id"] = str(item["_id"])  # Convert ObjectId to string
        item["creation_date"] = item["creation_date"].isoformat() if "creation_date" in item else None
    return jsonify(items), 200


@app.route("/api/item/add", methods=["GET", "POST"])
@login_required
def add_item():
    if request.method == "GET":
        template = {
            "possessor": current_user.username,
            "name": "",
            "description": "",
            "value": 0.0,
            "creation_date": "",    # expected ISO string e.g. "2025-08-18T14:00:00Z"
            "item_date": "",        # same format
            "location": "",
            "creator": "",
            "tags": [],             # list of strings
            "image_path": "",       # e.g., "uploads/item123.jpg"
            "category": "",
            "comment": "",
            "condition": ""         # e.g., "New", "Used", etc.
        }
        return jsonify(template), 200
    
    else:  # POST
        data = request.get_json()

        required_fields = ["possessor", "name", "value", "tags", "condition"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing fields"}), 400

        item = {
            "possessor": data["possessor"],
            "name": data["name"],
            "description": data["description"] or "",
            "value": data["value"] or 0,
            "creation_date": datetime.datetime.now(datetime.timezone.utc),
            "item_date": data["item_date"] or "",
            "location": data["location"] or "",
            "creator": current_user.username,
            "tags": data["tags"],
            "image_path": data["image_path"] or "not-image.png",
            "category": data["category"] or "",
            "comment": data["comment"] or "",
            "condition": data["condition"] or "",
        }

        result = db.items.insert_one(item)
        return jsonify({ "message": "Item added", "id": str(result.inserted_id) }), 201


@app.route("/api/item/delete", methods=["DELETE"])
@login_required
def delete_item():
    data = request.get_json()
    item_id = data.get("id")

    if not item_id:
        return jsonify({"message": "Item ID is required"}), 400

    result = db.items.delete_one({"_id": ObjectId(item_id)})

    if result.deleted_count == 1:
        return jsonify({"message": "Item deleted successfully"}), 200
    else:
        return jsonify({"message": "Item not found"}), 404
    

@app.route("/api/item/update/<id>", methods=["GET"])
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


@app.route("/api/item/update/<id>", methods=["POST"])
@login_required
def update_item(id):
    data = request.json

    # Validate fields here as needed
    update_fields = {
        "name": data.get("name"),
        "description": data.get("description"),
        "value": data.get("value"),
        "item_date": data.get("item_date"),
        "location": data.get("location"),
        "tags": data.get("tags"),
        "image_path": data.get("image_path"),
        "creator": data.get("creator"),
        "category": data.get("category"),
        "comment": data.get("comment"),
        "condition": data.get("condition"),
        "possessor": data.get("possessor"),
    }

    # Remove keys with None values (optional)
    update_fields = {k: v for k, v in update_fields.items() if v is not None}

    result = db.items.update_one(
        { "_id": ObjectId(id) },
        { "$set": update_fields }
    )

    if result.matched_count == 0:
        return jsonify({ "message": "Item not found." }), 404

    return jsonify({ "message": "Item updated successfully." }), 200