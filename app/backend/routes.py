from datetime import datetime
from flask import request, jsonify
from flask_login import login_required, current_user
from __main__ import app, db



@app.route("/api")
def hello():
    print("Route triggered: hello")
    return jsonify({
        "message": "Hello from Flask!",
        "status": "OK"
    }), 200


@app.route("/api/items", methods=["GET"])
@login_required
def get_items():
    items = list(db.items.find())
    for item in items:
        item["_id"] = str(item["_id"])  # Convert ObjectId to string
        item["creation_date"] = item["creation_date"].isoformat() if "creation_date" in item else None
    return jsonify(items), 200


@app.route("/api/item/add", methods=["POST"])
@login_required
def add_item():
    data = request.get_json()

    required_fields = ["name", "value", "tags", "condition"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing fields"}), 400

    item = {
        "name": data["name"],
        "description": data["description"] or "",
        "value": data["value"] or 0,
        "creation_date": datetime.utcnow(),
        "item_date": data["item_date"] or "",
        "location": data["location"] or "",
        "creator": current_user.username,
        "tags": data["tags"],
        "image_path": data["image_path"] or "not-image.png",
        "category": data["category"] or "",
        "comment": data["comment"],
        "condition": data["condition"],
    }

    result = db.items.insert_one(item)
    return jsonify({ "message": "Item added", "id": str(result.inserted_id) }), 201
