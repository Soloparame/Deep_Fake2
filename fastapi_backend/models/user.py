from fastapi_backend.database import users_col
from typing import Optional, Dict, Any
import uuid
import datetime

class UserModel:
    """
    MongoDB Model for User operations.
    Wraps the users_col collection.
    """

    @staticmethod
    def get_by_email(email: str) -> Optional[Dict[str, Any]]:
        return users_col.find_one({"email": email})

    @staticmethod
    def create(data: Dict[str, Any]) -> Dict[str, Any]:
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        if "created_at" not in data:
            data["created_at"] = datetime.datetime.utcnow()
        
        users_col.insert_one(data)
        return data

    @staticmethod
    def update_password_by_email(email: str, new_hash: str) -> bool:
        res = users_col.update_one({"email": email}, {"$set": {"password_hash": new_hash}})
        return getattr(res, "matched_count", 0) > 0

    @staticmethod
    def get_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        return users_col.find_one({"id": user_id})

    @staticmethod
    def update_password_by_id(user_id: str, new_hash: str) -> bool:
        res = users_col.update_one({"id": user_id}, {"$set": {"password_hash": new_hash}})
        return getattr(res, "matched_count", 0) > 0

    @staticmethod
    def update_last_login_by_id(user_id: str, dt: datetime.datetime) -> bool:
        res = users_col.update_one({"id": user_id}, {"$set": {"last_login": dt}})
        return getattr(res, "matched_count", 0) > 0
