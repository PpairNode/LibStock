import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from app.api import api_bp
from app.authentification import auth_bp
from app.extensions import login_manager, bcrypt


def create_app():
    # Load .env file
    load_dotenv()

    # The APP + Settings
    app = Flask(__name__, template_folder='../frontend')
    app.secret_key = os.getenv("APP_SECRET_KEY")

    # Add cross origin cookies
    CORS(app, supports_credentials=True, origins=["https://localhost:3000"])

    # Set bcrypt
    bcrypt.init_app(app)

    # Set the login manager
    login_manager.init_app(app)
    login_manager.login_view = "login"

    # Register routes blueprint
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(auth_bp)

    return app
