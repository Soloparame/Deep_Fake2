from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv
import os
import datetime
import uuid
 
# Load environment variables from fastapi_backend/.env
ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(ENV_PATH)
 
MONGO_URI = os.getenv("MONGO_URI")
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
    
    import certifi
    
    # Connect with SSL/TLS context for Atlas compatibility
    client = MongoClient(
        MONGO_URI, 
        serverSelectionTimeoutMS=5000,
        tlsCAFile=certifi.where()
    )
    
    # Quick connectivity check
    client.admin.command("ping")
    print("✅ MongoDB connection successful")
    
    # Use a dedicated database
    # If the URI has a database name, pymongo uses it. Otherwise defaults to 'test' or specified here.
    # We prefer the one from URI if present, else "deepfake_db"
    try:
        db = client.get_database("deepfake_db")
    except:
        db = client.get_default_database("deepfake_db")
    
    # Collections
    users_col = db["users"]
    predictions_col = db["predictions"]
    chats_col = db["chats"]
    
except Exception as e:
    print(f"⚠️  MongoDB connection failed: {e}")
    if "10061" in str(e):
        print("   -> This usually means your IP address is not whitelisted in MongoDB Atlas.")
        print("   -> Go to Atlas Dashboard > Network Access > Add IP Address > Allow Access from Anywhere (0.0.0.0/0)")
    print("⚠️  Running with JSON file storage - data will be persisted locally")
    
    import json
    
    class JsonCollection:
        def __init__(self, name):
            self.name = name
            self.file_path = os.path.join(os.path.dirname(__file__), f"local_db_{name}.json")
            if not os.path.exists(self.file_path):
                with open(self.file_path, 'w') as f:
                    json.dump([], f)
        
        def _load(self):
            try:
                with open(self.file_path, 'r') as f:
                    return json.load(f)
            except:
                return []
        
        def _save(self, data):
            with open(self.file_path, 'w') as f:
                json.dump(data, f, default=str)

        def insert_one(self, doc):
            data = self._load()
            if '_id' not in doc:
                doc['_id'] = str(uuid.uuid4())
            data.append(doc)
            self._save(data)
            return type('obj', (object,), {'inserted_id': doc['_id']})()
        
        def find_one(self, query):
            data = self._load()
            for item in data:
                match = True
                for k, v in query.items():
                    if item.get(k) != v:
                        match = False
                        break
                if match:
                    return item
            return None
        
        def find(self, query=None, sort=None, limit=0):
            data = self._load()
            results = []
            
            # 1. Filter
            if not query:
                results = data
            else:
                for item in data:
                    match = True
                    for k, v in query.items():
                        if item.get(k) != v:
                            match = False
                            break
                    if match:
                        results.append(item)
            
            # 2. Sort (simple implementation)
            if sort:
                # sort is a list of tuples like [("created_at", 1)]
                key, direction = sort[0]
                reverse = direction == -1
                try:
                    results.sort(key=lambda x: x.get(key, ""), reverse=reverse)
                except:
                    pass
            
            # 3. Limit
            if limit > 0:
                results = results[:limit]
                
            return results
        
        def update_one(self, query, update):
            data = self._load()
            updated_count = 0
            for item in data:
                match = True
                for k, v in query.items():
                    if item.get(k) != v:
                        match = False
                        break
                if match:
                    if '$set' in update:
                        for k, v in update['$set'].items():
                            item[k] = v
                    updated_count = 1
                    break
            if updated_count:
                self._save(data)
            return type('obj', (object,), {'matched_count': updated_count})()
        
        def delete_one(self, query):
            data = self._load()
            new_data = []
            deleted_count = 0
            for item in data:
                match = True
                for k, v in query.items():
                    if item.get(k) != v:
                        match = False
                        break
                if match:
                    deleted_count = 1
                else:
                    new_data.append(item)
            if deleted_count:
                self._save(new_data)
            return type('obj', (object,), {'deleted_count': deleted_count})()
    
    users_col = JsonCollection("users")
    predictions_col = JsonCollection("predictions")
    chats_col = JsonCollection("chats")

# Helper utils
def now_iso() -> str:
    return datetime.datetime.utcnow().isoformat()

def new_id() -> str:
    return str(uuid.uuid4())
