from bson import ObjectId
from bson.errors import InvalidId
from flask_login import current_user
from app.db import db


def safe_object_id(id_string):
    """Safely convert string to ObjectId"""
    try:
        return ObjectId(id_string)
    except (InvalidId, TypeError):
        return None

def safe_float(value, default=0.0):
    """Safely convert value to float"""
    if value is None:
        return default
    try:
        return round(float(value), 2)
    except (ValueError, TypeError):
        return default

def safe_int(value, default=0):
    """Safely convert value to integer"""
    if value is None:
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

def get_container_access(container_id: str, user_id):
    """Check if user has access to container"""
    container_id = safe_object_id(container_id)
    if container_id is None:
        print(f"Unknown container ID: {container_id}!")
        return None, None
    
    container = db.containers.find_one({"_id": container_id})
    if not container:
        return None, None
    
    user_id = safe_object_id(current_user.id)
    if user_id != container["admin_id"] and user_id not in container["member_ids"]:
        print(f"Unauthorized access detected from user ID: {user_id}!")
        return None, None
    
    return container, container_id
