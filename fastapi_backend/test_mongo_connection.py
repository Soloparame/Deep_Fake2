"""
Quick script to test MongoDB connection
Run this to verify your .env connection string is correct
"""
import os
from dotenv import load_dotenv
from pymongo import MongoClient
import certifi

# Load .env file
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path)

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    print("❌ MONGO_URI not found in .env file")
    print("   Please add: MONGO_URI=mongodb+srv://...")
    exit(1)

print(f"🔍 Testing connection string...")
print(f"   URI format: {'✅ mongodb+srv://' if 'mongodb+srv://' in MONGO_URI else '❌ Wrong format (should be mongodb+srv://)'}")
print(f"   Has port 27017: {'❌ YES (remove it!)' if ':27017' in MONGO_URI else '✅ No port (correct)'}")
print()

try:
    print("🔌 Attempting connection...")
    client = MongoClient(
        MONGO_URI,
        serverSelectionTimeoutMS=10000,
        tlsCAFile=certifi.where()
    )
    
    # Test connection
    client.admin.command("ping")
    print("✅ MongoDB connection successful!")
    print()
    
    # Get database
    db = client.get_database("deepfake_db")
    print(f"📊 Database: {db.name}")
    print()
    
    # List collections
    collections = db.list_collection_names()
    print(f"📁 Collections ({len(collections)}):")
    for col_name in collections:
        count = db[col_name].count_documents({})
        print(f"   - {col_name}: {count} documents")
    
    if not collections:
        print("   (No collections yet - they'll be created when you use the app)")
    
    print()
    print("🎉 Everything is working! Your connection string is correct.")
    
except Exception as e:
    print(f"❌ Connection failed: {e}")
    print()
    print("🔧 Troubleshooting:")
    
    if "mongodb+srv://" not in MONGO_URI:
        print("   ❌ Connection string must use 'mongodb+srv://' not 'mongodb://'")
    
    if ":27017" in MONGO_URI:
        print("   ❌ Remove port :27017 from connection string")
    
    if "10061" in str(e) or "refused" in str(e).lower():
        print("   ❌ IP address not whitelisted in MongoDB Atlas")
        print("      Go to: Network Access → Add IP Address → Allow from Anywhere")
    
    if "authentication" in str(e).lower() or "auth" in str(e).lower():
        print("   ❌ Wrong username or password")
        print("      Check Database Access in Atlas")
    
    print()
    print("💡 Check FIX_MONGODB_CONNECTION.md for detailed help")



