from flask import request, jsonify
from flask_login import login_required, current_user
from pymongo.errors import DuplicateKeyError
from app.api import api_bp
from app.db import db
from app.utils import MAX_SIZE_NAME
from app.api.utils.helpers import safe_object_id, get_container_access


@api_bp.route("/container/<container_id>/categories", methods=["GET"])
@login_required
def list_categories(container_id):
    """
    List all categories in a container
    ---
    tags:
      - Categories
    security:
      - Session: []
    parameters:
      - name: container_id
        in: path
        type: string
        required: true
        description: Container ID
    responses:
      200:
        description: List of categories
        schema:
          type: array
          items:
            type: object
            properties:
              _id:
                type: string
                example: "507f1f77bcf86cd799439011"
              name:
                type: string
                example: "ELECTRONICS"
              container_id:
                type: string
      401:
        description: Not authenticated
      403:
        description: Unauthorized access
    """
    container, container_id = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": "Unauthorized access to this container!"}), 403
    
    categories = list(db.categories.find({"container_id": container_id}))
    for cat in categories:
        cat["_id"] = str(cat["_id"])
        cat["container_id"] = str(cat["container_id"])
    return jsonify(categories), 200


@api_bp.route("/container/<container_id>/category/add", methods=["POST"])
@login_required
def add_category(container_id):
    """
    Add a new category to a container
    ---
    tags:
      - Categories
    security:
      - Session: []
    parameters:
      - name: container_id
        in: path
        type: string
        required: true
        description: Container ID
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - name
          properties:
            name:
              type: string
              example: "Electronics"
              maxLength: 200
    responses:
      201:
        description: Category created successfully
        schema:
          type: object
          properties:
            message:
              type: string
            id:
              type: string
      400:
        description: Invalid input
      401:
        description: Not authenticated
      403:
        description: Unauthorized access
      409:
        description: Category already exists
    """
    container, container_id = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": "Unauthorized access to this container!"}), 403

    data = request.get_json()
    required_fields = ["name"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing fields"}), 400
    
    category_name = data["name"].strip().upper()
    if not category_name or len(category_name) > MAX_SIZE_NAME:
        return jsonify({"error": f"Invalid category name length ({MAX_SIZE_NAME} characters maximum)"}), 400
    
    category = {
        "name": category_name,
        "container_id": container_id
    }
    
    try:
        result = db.categories.insert_one(category)
    except DuplicateKeyError:
        return jsonify({"error": "Category already exists"}), 409
    
    return jsonify({"message": "Category added", "id": str(result.inserted_id)}), 201


@api_bp.route("/container/<container_id>/category/update/<category_id>", methods=["POST"])
@login_required
def update_category(container_id, category_id):
    """
    Update a category name
    ---
    tags:
      - Categories
    security:
      - Session: []
    parameters:
      - name: container_id
        in: path
        type: string
        required: true
      - name: category_id
        in: path
        type: string
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - name
          properties:
            name:
              type: string
              maxLength: 200
    responses:
      201:
        description: Category updated
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

    data = request.get_json()
    category_id = safe_object_id(category_id)
    if category_id is None:
        return jsonify({"error": "Invalid category ID"}), 400

    required_fields = ["name"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing fields"}), 400
    
    cat_name = data['name']
    if not cat_name or len(cat_name) > MAX_SIZE_NAME:
        return jsonify({"error": f"Invalid category name length ({MAX_SIZE_NAME} characters maximum)"}), 400
    
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
    """
    Delete a category and all its items
    ---
    tags:
      - Categories
    security:
      - Session: []
    parameters:
      - name: container_id
        in: path
        type: string
        required: true
      - name: category_id
        in: path
        type: string
        required: true
    responses:
      200:
        description: Category deleted successfully
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
    
    category_id = safe_object_id(category_id)
    if category_id is None:
        return jsonify({"error": "Invalid category ID"}), 400
    
    # Delete all items which are contained in this category
    db.items.delete_many({"container_id": container_id, "category_id": category_id})
    result = db.categories.delete_one({"container_id": container_id, "_id": category_id})
    
    if result.deleted_count == 1:
        return jsonify({"message": "Category deleted successfully"}), 200
    else:
        return jsonify({"message": "Category not found"}), 404