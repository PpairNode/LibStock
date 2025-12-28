from flask_bcrypt import Bcrypt
from flask_login import LoginManager
# Rate limit
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flasgger import Swagger
from app.swagger_config import swagger_config, swagger_template

login_manager = LoginManager()
bcrypt = Bcrypt()
limiter = Limiter(key_func=get_remote_address, default_limits=["2000 per day", "100 per hour"])
swagger = Swagger(template=swagger_template, config=swagger_config)