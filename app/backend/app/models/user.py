from bson import ObjectId
from flask_login import UserMixin
from app.db import db


class User(UserMixin):
    """User model for Flask-Login"""
    def __init__(self, user_data):
        self.id = str(user_data["_id"])
        self.username = user_data["username"]
    
    @staticmethod
    def get_by_id(user_id):
        """Get user by ID"""
        user_data = db.users.find_one({"_id": ObjectId(user_id)})
        if user_data:
            return User(user_data)
        return None
    
    @staticmethod
    def get_by_username(username):
        """Get user by username"""
        user_data = db.users.find_one({"username": username})
        if user_data:
            return User(user_data)
        return None