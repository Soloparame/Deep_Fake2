from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv
import os
import datetime
import uuid
import certifi

# Load environment variables from fastapi_backend/.env
# Try absolute path first, then relative
ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if not os.path.exists(ENV_PATH):
    ENV_PATH = os.path.join(os.getcwd(), "fastapi_backend", ".env")

print(f"Loading env from: {ENV_PATH}")
load_dotenv(ENV_PATH)

MONGO_URI = os.getenv("MONGO_URI")
print(f"MONGO_URI loaded: {'Yes' if MONGO_URI else 'No'}")

if not MONGO_URI:
    print("⚠️  MONGO_URI not found in environment - MongoDB will be disabled")
    MONGO_URI = None
 
# Create MongoDB client (optional connection)
client = None
db = None
users_col = None
predictions_col = None
chats_col = None

# Try to connect to MongoDB, but don't fail if connection is not available
try:
    if MONGO_URI is None:
        raise Exception("MONGO_URI not configured")
    
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)  # 5 second timeout
    # Quick connectivity check
    client.admin.command("ping")
    print("✅ MongoDB connection successful")
    
    # Use a dedicated database
    db = client["deepfake_db"]
    
    # Collections
    users_col = db["users"]
    predictions_col = db["predictions"]
    chats_col = db["chats"]
    
except Exception as e:
    print(f"⚠️  MongoDB connection failed: {e}")
    print("⚠️  Running without MongoDB - data will not be persisted")
    # Set up dummy collections that will handle operations gracefully
    class DummyCollection:
        def insert_one(self, *args, **kwargs):
            print(f"⚠️  MongoDB not connected - skipping insert operation")
            return type('obj', (object,), {'inserted_id': None})()
        
        def find_one(self, *args, **kwargs):
            return None
        
        def find(self, *args, **kwargs):
            return []
        
        def update_one(self, *args, **kwargs):
            print(f"⚠️  MongoDB not connected - skipping update operation")
            return type('obj', (object,), {'matched_count': 0})()
        
        def delete_one(self, *args, **kwargs):
            print(f"⚠️  MongoDB not connected - skipping delete operation")
            return type('obj', (object,), {'deleted_count': 0})()
    
    users_col = DummyCollection()
    predictions_col = DummyCollection()
    chats_col = DummyCollection()

# Helper utils
def now_iso() -> str:
    return datetime.datetime.utcnow().isoformat()

def new_id() -> str:
    return str(uuid.uuid4())
