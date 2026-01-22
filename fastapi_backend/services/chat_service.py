import datetime
from typing import List, Optional, Dict, Any
from fastapi_backend.models.chat import ChatModel
from fastapi_backend.models.knowledge import KnowledgeModel
from fastapi_backend.schemas.chat import ChatMessage, ChatSession, ChatSessionDetail
import difflib

class ChatService:
    @staticmethod
    def get_user_sessions(user_id: str) -> List[ChatSession]:
        raw_sessions = ChatModel.get_user_sessions(user_id)
        return [
            ChatSession(
                session_id=doc["session_id"],
                title=doc.get("title", "New Chat"),
                created_at=doc["created_at"].isoformat(),
                updated_at=doc["updated_at"].isoformat()
            )
            for doc in raw_sessions
        ]

    @staticmethod
    def get_session_detail(session_id: str, user_id: str) -> Optional[ChatSessionDetail]:
        doc = ChatModel.get_session(session_id, user_id)
        if not doc:
            return None
            
        messages = [
            ChatMessage(
                id=msg.get("id", ""),
                role=msg.get("role", ""),
                text=msg.get("text", ""),
                created_at=msg.get("created_at") if isinstance(msg.get("created_at"), str) else msg.get("created_at").isoformat()
            )
            for msg in doc.get("messages", [])
        ]
        
        return ChatSessionDetail(
            session_id=doc["session_id"],
            title=doc.get("title", "New Chat"),
            created_at=doc["created_at"].isoformat(),
            updated_at=doc["updated_at"].isoformat(),
            messages=messages
        )

    @staticmethod
    def create_session(user_id: str, title: str) -> str:
        return ChatModel.create_session(user_id, title)

    @staticmethod
    def get_latest_session_messages(user_id: str) -> Dict[str, List[ChatMessage]]:
        sessions = ChatModel.get_user_sessions(user_id)
        if not sessions:
            return {"messages": []}
        
        # Sort by updated_at desc
        sessions.sort(key=lambda x: x["updated_at"], reverse=True)
        latest_session_id = sessions[0]["session_id"]
        
        detail = ChatService.get_session_detail(latest_session_id, user_id)
        if detail:
            return {"messages": detail.messages}
        return {"messages": []}

    @staticmethod
    def get_suggested_questions() -> List[str]:
        knowledge_base = KnowledgeModel.get_all()
        return [entry["question"] for entry in knowledge_base]

    @staticmethod
    def find_answer(question: str) -> str:
        """
        Simple fuzzy matching for knowledge base.
        """
        knowledge_base = KnowledgeModel.get_all()
        
        # 1. Exact match (case insensitive)
        for entry in knowledge_base:
            if entry["question"].lower() == question.lower():
                return entry["answer"]
        
        # 2. Fuzzy match
        questions = [entry["question"] for entry in knowledge_base]
        matches = difflib.get_close_matches(question, questions, n=1, cutoff=0.6)
        
        if matches:
            matched_q = matches[0]
            for entry in knowledge_base:
                if entry["question"] == matched_q:
                    return entry["answer"]
                    
        return "I'm not sure about that. Try asking about deepfakes or detection."

    @staticmethod
    def process_message(user_id: str, session_id: Optional[str], message_text: str):
        # 1. Ensure session exists
        if not session_id:
            session_id = ChatModel.create_session(user_id, title=message_text[:30] + "...")
        else:
            # Verify ownership
            existing = ChatModel.get_session(session_id, user_id)
            if not existing:
                # If invalid session, create new one
                session_id = ChatModel.create_session(user_id, title=message_text[:30] + "...")

        now = datetime.datetime.utcnow()
        
        # 2. Prepare user message
        user_msg = {
            "id": str(now.timestamp()).replace(".", ""),
            "role": "user",
            "text": message_text,
            "created_at": now.isoformat()
        }
        ChatModel.add_message(session_id, user_id, user_msg)
        
        # 3. Find answer
        answer_text = ChatService.find_answer(message_text)
        
        # 4. Prepare assistant message
        assistant_msg = {
            "id": str((now + datetime.timedelta(seconds=1)).timestamp()).replace(".", ""),
            "role": "assistant",
            "text": answer_text,
            "created_at": (now + datetime.timedelta(seconds=1)).isoformat()
        }
        ChatModel.add_message(session_id, user_id, assistant_msg)
        
        # 5. Return response
        return {
            "response": answer_text,
            "session_id": session_id,
            "message": ChatMessage(
                id=assistant_msg["id"],
                role=assistant_msg["role"],
                text=assistant_msg["text"],
                created_at=assistant_msg["created_at"]
            )
        }
