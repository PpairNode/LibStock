import os
from flask import Flask, Response, request
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

    # Set
    app.config['SESSION_COOKIE_SECURE'] = True  # Send cookie only over HTTPS
    app.config['SESSION_COOKIE_SAMESITE'] = 'None'  # Required for cross-origin cookies
    app.config['SESSION_COOKIE_HTTPONLY'] = True  # Optional security

    # Set bcrypt
    bcrypt.init_app(app)

    # Set the login manager
    login_manager.init_app(app)
    login_manager.login_view = "auth.login"
    
    # Add cross origin cookies
    CORS(app, supports_credentials=True, resources={r"*": {"origins": [os.getenv("REACT_HOST_ORIGIN")]}}, max_age=86400)
    app.secret_key = os.getenv("APP_SECRET_KEY")

    # Register routes blueprint
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(api_bp, url_prefix='/api')


    return app
