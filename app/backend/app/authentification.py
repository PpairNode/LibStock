from bson import ObjectId
from flask import request, redirect, url_for, jsonify, Blueprint
from flask_login import login_user, login_required, logout_user, UserMixin, current_user
from app.db import db
from app.extensions import login_manager, bcrypt



auth_bp = Blueprint("auth", __name__)


# User class
class User(UserMixin):
    def __init__(self, user_data):
        self.id = str(user_data["_id"])
        self.username = user_data["username"]


@login_manager.user_loader
def load_user(user_id):
    user_data = db.users.find_one({"_id": ObjectId(user_id)})
    if user_data:
        return User(user_data)
    return None

# Unauthorized users redirected properly
@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({ "error": "Unauthorized" }), 401


# Routes
@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated == True:
        return jsonify({ "authenticated": True, "redirect": "/dashboard" }), 200
    if request.method == "POST":
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")
        user_data = db.users.find_one({ "username": username })
        if user_data and bcrypt.check_password_hash(pw_hash=user_data["password"], password=password):
            user = User(user_data)
            if login_user(user):
                return jsonify({ "message": "Login successful", "redirect": "/dashboard" }), 200
        return jsonify({ "message": "Invalid credentials" }), 401
    return jsonify({ "message": "Please log in", "login_required": True }), 200


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))