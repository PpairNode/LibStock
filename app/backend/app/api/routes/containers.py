from flask import request, jsonify
from flask_login import login_required, current_user
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from app.api import api_bp
from app.db import db
from app.utils import MAX_SIZE_NAME
from app.api.utils.helpers import safe_object_id, get_container_access


@api_bp.route("/containers", methods=["GET"])
@login_required
def list_containers():
    """
    List all containers for current user
    ---
    tags:
      - Containers
    security:
      - Session: []
    responses:
      200:
        description: List of containers
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
                example: "My Collection"
              admin_id:
                type: string
                example: "507f1f77bcf86cd799439012"
              member_ids:
                type: array
                items:
                  type: string
      401:
        description: Not authenticated
    """
    user_id = ObjectId(current_user.id)
    containers = list(db.containers.find({"member_ids": user_id}))
    for container in containers:
        container["_id"] = str(container["_id"])
        container["admin_id"] = str(container["admin_id"])
        container["member_ids"] = [str(uid) for uid in container["member_ids"]]
    return jsonify(containers), 200


@api_bp.route("/container/add", methods=["POST"])
@login_required
def add_container():
    """
    Create a new container
    ---
    tags:
      - Containers
    security:
      - Session: []
    parameters:
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
              example: "Video Games Collection"
              maxLength: 200
    responses:
      201:
        description: Container created successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Container added"
            id:
              type: string
              example: "507f1f77bcf86cd799439011"
      400:
        description: Invalid input
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Missing fields"
      401:
        description: Not authenticated
      409:
        description: Container already exists
    """
    data = request.get_json()
    required_fields = ["name"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing fields"}), 400
    
    container_name = data["name"].strip()
    if not container_name or len(container_name) > MAX_SIZE_NAME:
        return jsonify({"error": f"Invalid container name length ({MAX_SIZE_NAME} characters maximum)"}), 400
    
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

    return jsonify({"message": "Container added", "id": str(result.inserted_id)}), 201


@api_bp.route("/container/delete/<container_id>", methods=["DELETE"])
@login_required
def delete_container(container_id):
    """
    Delete a container and all its contents
    ---
    tags:
      - Containers
    security:
      - Session: []
    parameters:
      - name: container_id
        in: path
        type: string
        required: true
        description: Container ID
        example: "507f1f77bcf86cd799439011"
    responses:
      200:
        description: Container deleted successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Container deleted successfully"
      401:
        description: Not authenticated
      403:
        description: Unauthorized access
      404:
        description: Container not found
    """
    container, container_id = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": "Unauthorized access to this container!"}), 403

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
    """
    Update container name
    ---
    tags:
      - Containers
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
              example: "Updated Collection Name"
              maxLength: 200
    responses:
      201:
        description: Container updated successfully
      400:
        description: Invalid input
      401:
        description: Not authenticated
      403:
        description: Unauthorized access
      404:
        description: Container not found
    """
    container, container_id = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": "Unauthorized access to this container!"}), 403

    data = request.get_json()
    required_fields = ["name"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing fields"}), 400
    
    container_name = data['name']
    if not container_name or len(container_name) > MAX_SIZE_NAME:
        return jsonify({"error": f"Invalid container name length ({MAX_SIZE_NAME} characters maximum)"}), 400
    
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
    """
    Get container details
    ---
    tags:
      - Containers
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
        description: Container details
        schema:
          type: object
          properties:
            _id:
              type: string
            name:
              type: string
            admin_id:
              type: string
            member_ids:
              type: array
              items:
                type: string
      401:
        description: Not authenticated
      403:
        description: Unauthorized access
    """
    container, container_id = get_container_access(container_id, current_user.id)
    if not container:
        return jsonify({"error": "Unauthorized access to this container!"}), 403

    # Convert ObjectIds to strings for JSON
    container["_id"] = str(container["_id"])
    if "admin_id" in container:
        container["admin_id"] = str(container["admin_id"])
    if "member_ids" in container:
        container["member_ids"] = [str(x) for x in container["member_ids"]]
    return container, 200
