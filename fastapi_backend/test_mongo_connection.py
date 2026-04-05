"""
Quick script to test MongoDB connection (local dev).
Run from repo root: python fastapi_backend/test_mongo_connection.py
"""
import os
from dotenv import load_dotenv
from pymongo import MongoClient
import certifi

_backend = os.path.dirname(os.path.abspath(__file__))
for path in (
    os.path.join(_backend, ".env"),
    os.path.join(os.path.dirname(_backend), ".env"),
):
    if os.path.isfile(path):
        load_dotenv(path, override=True)
        print(f"Loaded: {path}")
        break
else:
    load_dotenv(override=True)

raw = os.getenv("MONGO_URI") or ""
MONGO_URI = raw.strip().strip('"').strip("'")

if not MONGO_URI:
    print("MONGO_URI not found in .env")
    print("Add to fastapi_backend/.env, e.g.:")
    print('  MONGO_URI=mongodb+srv://USER:PASS@cluster.../  (Atlas)')
    print("  MONGO_URI=mongodb://127.0.0.1:27017  (local MongoDB)")
    raise SystemExit(1)

kwargs = {"serverSelectionTimeoutMS": 15000}
if MONGO_URI.startswith("mongodb+srv://"):
    kwargs["tlsCAFile"] = certifi.where()

print("Testing connection...")
print(f"  Type: {'Atlas (SRV)' if MONGO_URI.startswith('mongodb+srv://') else 'Standard URI'}")

try:
    client = MongoClient(MONGO_URI, **kwargs)
    client.admin.command("ping")
    print("OK — MongoDB connection successful.")
    db = client.get_database("deepfake_db")
    print(f"Database: {db.name}")
    names = db.list_collection_names()
    print(f"Collections: {len(names)}")
    for col_name in names[:20]:
        print(f"  - {col_name}: {db[col_name].count_documents({})} docs")
    if len(names) > 20:
        print("  ...")
except Exception as e:
    print(f"FAILED: {e}")
    print()
    print("Checks:")
    print("  Atlas: Network Access — allow your IP (or 0.0.0.0/0 for testing).")
    print("  Atlas: Database user + password in the URI (URL-encode special chars in password).")
    print("  Local: ensure MongoDB service is running for mongodb://127.0.0.1:27017")
    raise SystemExit(1)
