from pathlib import Path


BASE_DIR = Path(__file__).parent
UPLOAD_FOLDER = BASE_DIR / "uploads" / "image"
MAX_SIZE_NAME = 256
MAX_SIZE_TEXT = 4096
MAX_SIZE_TAGS_LIST = 10