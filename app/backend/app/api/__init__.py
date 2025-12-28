from flask import Blueprint

api_bp = Blueprint("api", __name__)

# Import routes to register them
from app.api.routes import user, containers, categories, items, media
