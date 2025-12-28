from flask import request, jsonify, redirect, url_for
from flask_login import login_user, logout_user, login_required, current_user
from app.api import api_bp
from app.models.user import User
from app.extensions import bcrypt


@api_bp.route("/login", methods=["OPTIONS", "GET", "POST"])
def login():
    """
    User login
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: false
        schema:
          type: object
          properties:
            username:
              type: string
              example: "john_doe"
            password:
              type: string
              example: "password123"
    responses:
      200:
        description: Login successful or already authenticated
        schema:
          type: object
          properties:
            message:
              type: string
            redirect:
              type: string
            authenticated:
              type: boolean
      401:
        description: Invalid credentials
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Invalid credentials"
    """
    if current_user.is_authenticated:
        return jsonify({"authenticated": True, "redirect": "/dashboard"}), 200
    
    if request.method == "POST":
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")
        
        if not username or not password:
            return jsonify({"message": "Missing username or password"}), 400
        
        user = User.get_by_username(username)
        if user:
            from app.db import db
            user_data = db.users.find_one({"username": username})
            if bcrypt.check_password_hash(pw_hash=user_data["password"], password=password):
                if login_user(user):
                    return jsonify({"message": "Login successful", "redirect": "/dashboard"}), 200
        
        return jsonify({"message": "Invalid credentials"}), 401
    
    return jsonify({"message": "Please log in", "login_required": True}), 200


@api_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    """
    User logout
    ---
    tags:
      - Authentication
    security:
      - Session: []
    responses:
      302:
        description: Redirect to login page
      401:
        description: Not authenticated
    """
    logout_user()
    return redirect(url_for("api.login"))


@api_bp.route("/user", methods=["GET"])
@login_required
def get_current_user():
    """
    Get current user information
    ---
    tags:
      - User
    security:
      - Session: []
    responses:
      200:
        description: Current user details
        schema:
          type: object
          properties:
            username:
              type: string
              example: "john_doe"
      401:
        description: Not authenticated
    """
    return jsonify({"username": current_user.username})