import os
from flask import Flask, Response, request
from flask_cors import CORS
from dotenv import load_dotenv
from app.api import api_bp
from app.authentification import auth_bp
from app.extensions import login_manager, bcrypt, limiter, swagger
from app.utils import UPLOAD_FOLDER


def create_app(debug: bool = False):
    # Load .env file
    load_dotenv()

    # The APP + Settings
    app = Flask(__name__, template_folder='../frontend')

    # Set secure values only in production (allow insecurity in debug mode to facilitate development)
    if not debug:
        app.config['SESSION_COOKIE_SECURE'] = True  # Send cookie only over HTTPS
        app.config['SESSION_COOKIE_SAMESITE'] = 'None'  # Required for cross-origin cookies
        app.config['SESSION_COOKIE_HTTPONLY'] = True  # Optional security
    else:
        app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Required for cross-origin cookies
        app.config['SESSION_COOKIE_SECURE'] = False
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Max 16MB

    # Set bcrypt
    bcrypt.init_app(app)

    # Set the login manager
    login_manager.init_app(app)
    login_manager.login_view = "auth.login"

    # Set the limiter
    limiter.init_app(app)

    # Set the swagger
    swagger.init_app(app)
    
    # Add cross origin cookies
    origin = os.getenv("REACT_HOST_ORIGIN")
    if "127.0.0.1" in origin:
        print("/!\\ WARNING: 127.0.0.1 in REACT_HOST_ORIGIN break cookies -> Instead use localhost")
    CORS(app, supports_credentials=True, resources={r"*": {"origins": [origin]}}, max_age=86400)
    app.secret_key = os.getenv("APP_SECRET_KEY")

    # Register routes blueprint
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(api_bp, url_prefix='/api')


    return app
