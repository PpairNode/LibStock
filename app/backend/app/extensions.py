from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from flasgger import Swagger
import os


# Initialize without app
login_manager = LoginManager()
bcrypt = Bcrypt()

# Limiter configuration
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
    enabled=os.getenv("FLASK_ENV") == "production"
)

# Swagger configuration
from app.swagger_config import swagger_template, swagger_config
swagger = Swagger(template=swagger_template, config=swagger_config)

# User loader for Flask-Login
@login_manager.user_loader
def load_user(user_id):
    from app.models.user import User
    return User.get_by_id(user_id)

# Unauthorized handler
@login_manager.unauthorized_handler
def unauthorized():
    from flask import jsonify
    return jsonify({"error": "Unauthorized"}), 401
