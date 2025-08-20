import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv


# MongoDB setup
def get_mongo_client():
    # Load env variables
    load_dotenv()

    client = None
    MONGO_URI = os.getenv("MONGO_URI")
    if MONGO_URI:
        client = MongoClient(MONGO_URI)
    else:
        MONGO_HOST = os.getenv("MONGO_HOST")
        MONGO_PORT = os.getenv("MONGO_PORT")
        MONGO_SECRET = os.getenv("MONGO_SECRET")
        if None in [MONGO_HOST, MONGO_PORT, MONGO_SECRET]:
            print("Error: cannot load the environment variables")
            sys.exit(1)
        client = MongoClient(f'mongodb://{MONGO_SECRET}@{MONGO_HOST}/?authSource=admin&retryWrites=true&w=majority', port=int(MONGO_PORT))
    return client

client = get_mongo_client()
db = client["app"]
# Make sure categories collection is unique on name
db.categories.create_index("name", unique=True, collation={"locale": "en", "strength": 2})