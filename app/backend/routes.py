import datetime
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


# TODO: add a route for adding new categories
@app.route("/api/item/categories", methods=["GET"])
@login_required
def get_item_categories():
    return jsonify({
        "categories": ["BD", "Computer", "Militaria", "Movies", "Books"]
    })


@app.route("/api/dashboard", methods=["GET"])
@login_required
def dashboard():
    return jsonify({
        "message": f"Welcome {current_user.username}!",
        "username": current_user.username
    }), 200


@app.route("/api/items", methods=["GET"])
@login_required
def get_items():
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

        required_fields = ["name", "value", "tags", "condition"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing fields"}), 400

        item = {
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
