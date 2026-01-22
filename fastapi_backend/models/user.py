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
