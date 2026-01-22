from fastapi_backend.database import chat_sessions_col
from typing import List, Dict, Any, Optional
import datetime
import uuid

class ChatModel:
    """
    MongoDB Model for Chat operations (Session-based).
    Wraps the chat_sessions_col collection.
    """

    @staticmethod
    def create_session(user_id: str, title: str = "New Chat") -> str:
        """Creates a new chat session and returns its ID"""
        session_id = str(uuid.uuid4())
        doc = {
            "session_id": session_id,
            "user_id": user_id,
            "title": title,
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow(),
            "messages": []
        }
        chat_sessions_col.insert_one(doc)
        return session_id

    @staticmethod
    def get_user_sessions(user_id: str) -> List[Dict[str, Any]]:
        """Get all sessions for a user (without full message history for performance)"""
        try:
            cursor = chat_sessions_col.find(
                {"user_id": user_id},
                {"messages": 0} # Exclude messages list
            ).sort("updated_at", -1)
            return list(cursor)
        except Exception:
            return []

    @staticmethod
    def get_session(session_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get full session with messages"""
        return chat_sessions_col.find_one({"session_id": session_id, "user_id": user_id})

    @staticmethod
    def add_message(session_id: str, user_id: str, message: Dict[str, Any]):
        """Append a message to a session"""
        chat_sessions_col.update_one(
            {"session_id": session_id, "user_id": user_id},
            {
                "$push": {"messages": message},
                "$set": {"updated_at": datetime.datetime.utcnow()}
            }
        )
