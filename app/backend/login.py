from bson import ObjectId
from flask import render_template, request, redirect, url_for, jsonify
from flask_login import login_user, login_required, logout_user, UserMixin, current_user
from __main__ import login_manager, db, app, bcrypt



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

# Routes
@app.route("/api/login", methods=["GET", "POST"])
def login():
    print("User is trying to login...")
    if current_user.is_authenticated == True:
        print(f"User [{current_user.username}] is already authenticated!")
        return jsonify({ "authenticated": True, "redirect": "/dashboard" }), 200
    if request.method == "POST":
        print("Entered login! Getting data...")
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")
        print(f"Data retrieved: username={username} password={password}")
        user_data = db.users.find_one({ "username": username })
        if user_data and bcrypt.check_password_hash(pw_hash=user_data["password"], password=password):
            user = User(user_data)
            if login_user(user):
                print(f"Login success for user: {user.username}!")
                return jsonify({ "message": "Login successful", "redirect": "/dashboard" }), 200
        return jsonify({ "message": "Invalid credentials" }), 401
    return jsonify({ "message": "Please log in", "login_required": True }), 200

@app.route("/api/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))