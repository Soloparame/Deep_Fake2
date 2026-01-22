from fastapi_backend.database import chats_col
from typing import List, Dict, Any
import datetime

class ChatModel:
    """
    MongoDB Model for Chat operations.
    Wraps the chats_col collection.
    """

    @staticmethod
    def get_recent_messages(limit: int = 50) -> List[Dict[str, Any]]:
        try:
            cursor = chats_col.find({}, sort=[("created_at", 1)], limit=limit)
            return list(cursor)
        except Exception:
            return []

    @staticmethod
    def save_messages(messages: List[Dict[str, Any]]):
        if not messages:
            return
        try:
            chats_col.insert_many(messages)
        except Exception:
            pass
