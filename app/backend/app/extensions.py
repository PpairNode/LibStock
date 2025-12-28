from flask_bcrypt import Bcrypt
from flask_login import LoginManager
# Rate limit
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


login_manager = LoginManager()
bcrypt = Bcrypt()
limiter = Limiter(key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])
