import os
import secrets
from flask import Flask, jsonify
from flask_cors import CORS
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
from dotenv import load_dotenv


# Load .env file
load_dotenv()

# The APP + Settings
app = Flask(__name__, template_folder='../frontend')
app.secret_key = os.getenv("APP_SECRET_KEY")

# Add cross origin cookies
CORS(app, supports_credentials=True, origins=["https://localhost:3000"])

# MongoDB setup
MONGO_HOST = os.getenv("MONGO_HOST")
MONGO_PORT = os.getenv("MONGO_PORT")
MONGO_SECRET = os.getenv("MONGO_SECRET")
client = MongoClient(f'mongodb://{MONGO_SECRET}@{MONGO_HOST}/?authSource=admin&retryWrites=true&w=majority', port=int(MONGO_PORT))
db = client["app"]
# Make sure categories collection is unique on name
db.categories.create_index("name", unique=True, collation={"locale": "en", "strength": 2})

# Set the login implementation
login_manager = LoginManager()
login_manager.init_app(app)
# (optional) Unauthorized users redirected properly
login_manager.login_view = "login"

@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({ "error": "Unauthorized" }), 401

# Set Bcrypt
bcrypt = Bcrypt(app)

# Set login callback and routes
import login

# Set general routes for the flask app
import routes



# MAIN
if __name__ == "__main__":
    app.run(ssl_context='adhoc', debug=True)

