from bson import ObjectId
from flask import render_template, request, redirect, url_for
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
@app.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated == True:
        print(f"User [{current_user.username}] is already authenticated!")
        return redirect(url_for("dashboard"))
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        user_data = db.users.find_one({ "username": username })
        if user_data and bcrypt.check_password_hash(pw_hash=user_data["password"], password=password):
            user = User(user_data)
            if login_user(user):
                print(f"Login success for user: {user.username}!")
                return redirect(url_for("dashboard"))
        return "Invalid credentials", 401
    return render_template("login.html")

@app.route("/dashboard")
@login_required
def dashboard():
    print("Current user authenticated?", current_user.is_authenticated)
    print("Current user ID:", current_user.get_id())
    return render_template("dashboard.html", username=current_user.username)

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))