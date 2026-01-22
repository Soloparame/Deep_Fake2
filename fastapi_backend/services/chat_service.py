import datetime
from typing import List
from fastapi_backend.models.chat import ChatModel
from fastapi_backend.schemas.chat import ChatMessage

class ChatService:
    @staticmethod
    def get_history() -> List[ChatMessage]:
        raw_msgs = ChatModel.get_recent_messages()
        # Convert raw DB docs to Pydantic schemas
        return [
            ChatMessage(
                id=str(doc.get("id", "")),
                userId=str(doc.get("user_id", "")),
                role=doc.get("role", "assistant"),
                text=doc.get("text", ""),
                createdAt=(doc.get("created_at") or datetime.datetime.utcnow()).isoformat()
            )
            for doc in raw_msgs
        ]

    @staticmethod
    def process_message(user_id: str, message_text: str):
        now = datetime.datetime.utcnow()
        
        user_msg_data = {
            "id": str(now.timestamp()).replace(".", ""),
            "user_id": user_id,
            "role": "user",
            "text": message_text,
            "created_at": now
        }
        
        assistant_msg_data = {
            "id": str((now + datetime.timedelta(seconds=1)).timestamp()).replace(".", ""),
            "user_id": user_id,
            "role": "assistant",
            "text": "I received your message. Real AI processing will be implemented soon.",
            "created_at": now
        }
        
        ChatModel.save_messages([user_msg_data, assistant_msg_data])
        
        # Return formatted messages
        return {
            "response": assistant_msg_data["text"],
            "messages": [
                ChatMessage(
                    id=user_msg_data["id"],
                    userId=user_msg_data["user_id"],
                    role=user_msg_data["role"],
                    text=user_msg_data["text"],
                    createdAt=user_msg_data["created_at"].isoformat()
                ),
                ChatMessage(
                    id=assistant_msg_data["id"],
                    userId=assistant_msg_data["user_id"],
                    role=assistant_msg_data["role"],
                    text=assistant_msg_data["text"],
                    createdAt=assistant_msg_data["created_at"].isoformat()
                )
            ]
        }
