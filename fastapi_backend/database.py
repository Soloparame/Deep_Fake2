from pymongo import MongoClient
from dotenv import load_dotenv
import os
import datetime
import uuid
import certifi

_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_REPO_ROOT = os.path.dirname(_BACKEND_DIR)


def _load_env() -> None:
    """Load .env from the first path that exists (local dev only — no deployment config)."""
    candidates = [
        os.path.join(_BACKEND_DIR, ".env"),
        os.path.join(os.getcwd(), "fastapi_backend", ".env"),
        os.path.join(os.getcwd(), ".env"),
        os.path.join(_REPO_ROOT, ".env"),
    ]
    for path in candidates:
        if os.path.isfile(path):
            load_dotenv(path, override=True)
            print(f"Loading env from: {path}")
            return
    load_dotenv(override=True)
    print("⚠️  No .env file found next to fastapi_backend or repo root — using existing environment variables only.")


_load_env()


def _normalize_mongo_uri(raw: str | None) -> str | None:
    if not raw:
        return None
    u = raw.strip()
    if (u.startswith('"') and u.endswith('"')) or (u.startswith("'") and u.endswith("'")):
        u = u[1:-1].strip()
    return u or None


MONGO_URI = _normalize_mongo_uri(os.getenv("MONGO_URI"))
print(f"MONGO_URI loaded: {'Yes' if MONGO_URI else 'No'}")

if not MONGO_URI:
    print("⚠️  MONGO_URI not found — MongoDB will be disabled. Set MONGO_URI in fastapi_backend/.env")


def _mongo_client_kwargs(uri: str) -> dict:
    """Atlas (mongodb+srv) on Windows usually needs certifi's CA bundle for TLS."""
    kwargs: dict = {"serverSelectionTimeoutMS": 15000}
    if uri.startswith("mongodb+srv://"):
        kwargs["tlsCAFile"] = certifi.where()
    return kwargs


# Create MongoDB client (optional connection)
client = None
db = None
users_col = None
predictions_col = None
chats_col = None

try:
    if MONGO_URI is None:
        raise RuntimeError("MONGO_URI not configured")

    client = MongoClient(MONGO_URI, **_mongo_client_kwargs(MONGO_URI))
    client.admin.command("ping")
    print("✅ MongoDB connection successful")

    db = client["deepfake_db"]

    users_col = db["users"]
    predictions_col = db["predictions"]
    chats_col = db["chats"]
    chat_sessions_col = db["chat_sessions"]
    knowledge_col = db["knowledge_base"]
    analyses_col = db["analyses"]

except Exception as e:
    print(f"⚠️  MongoDB connection failed: {e}")
    print("⚠️  Running without MongoDB — data will not be persisted")
    print("   Local fix checklist:")
    print("   • Atlas: Network Access → add your current IP (or 0.0.0.0/0 for testing)")
    print("   • Atlas: Database Access → user/password matches MONGO_URI")
    print("   • Password with @ # / etc. must be URL-encoded inside the URI")
    print("   • Local MongoDB: use mongodb://127.0.0.1:27017 (MongoDB service running)")
    print("   • Run: python fastapi_backend/test_mongo_connection.py")

    _dummy_logged = {"insert": False, "insert_many": False, "update": False, "delete": False}

    class DummyCursor:
        def sort(self, *args, **kwargs):
            return self

        def limit(self, *args, **kwargs):
            return self

        def __iter__(self):
            return iter([])

    class DummyCollection:
        def insert_one(self, *args, **kwargs):
            if not _dummy_logged["insert"]:
                print("⚠️  MongoDB not connected — write operations are skipped until the DB is reachable.")
                _dummy_logged["insert"] = True
            return type("obj", (object,), {"inserted_id": None})()

        def insert_many(self, *args, **kwargs):
            if not _dummy_logged["insert_many"]:
                print("⚠️  MongoDB not connected — skipping bulk inserts.")
                _dummy_logged["insert_many"] = True
            return type("obj", (object,), {"inserted_ids": []})()

        def count_documents(self, *args, **kwargs):
            return 0

        def find_one(self, *args, **kwargs):
            return None

        def find(self, *args, **kwargs):
            return DummyCursor()

        def update_one(self, *args, **kwargs):
            if not _dummy_logged["update"]:
                print("⚠️  MongoDB not connected — skipping updates.")
                _dummy_logged["update"] = True
            return type("obj", (object,), {"matched_count": 0})()

        def delete_one(self, *args, **kwargs):
            if not _dummy_logged["delete"]:
                print("⚠️  MongoDB not connected — skipping deletes.")
                _dummy_logged["delete"] = True
            return type("obj", (object,), {"deleted_count": 0})()

    users_col = DummyCollection()
    predictions_col = DummyCollection()
    chats_col = DummyCollection()
    chat_sessions_col = DummyCollection()
    knowledge_col = DummyCollection()
    analyses_col = DummyCollection()


def now_iso() -> str:
    return datetime.datetime.utcnow().isoformat()


def new_id() -> str:
    return str(uuid.uuid4())
