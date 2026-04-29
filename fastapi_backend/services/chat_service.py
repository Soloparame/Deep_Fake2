import datetime
from typing import List, Optional, Dict, Any
from fastapi_backend.models.chat import ChatModel
from fastapi_backend.models.knowledge import KnowledgeModel
from fastapi_backend.schemas.chat import ChatMessage, ChatSession, ChatSessionDetail
import difflib


BUILTIN_QA: List[Dict[str, str]] = [
    {
        "question": "What is deepfake?",
        "answer": "A deepfake is AI-generated fake media (video or image) that manipulates identity or events. RealEye helps detect likely manipulation patterns and provides confidence signals.",
    },
    {
        "question": "How can I detect a deepfake?",
        "answer": "Use Upload to scan a video or image. RealEye analyzes sampled frames or image features, then returns REAL/FAKE style outcomes with confidence and context.",
    },
    {
        "question": "How does the system work step by step?",
        "answer": "Flow: upload input -> preprocessing -> model inference -> confidence scoring -> result rendering -> optional history save. For Project Intel, it also runs smart context extraction, web search, similarity scoring, and strategy generation.",
    },
    {
        "question": "What is Project Intel?",
        "answer": "Project Intel is RealEye's strategy analysis workspace. It goes beyond plagiarism checks and includes similarity intelligence, competitor discovery, SWOT, tech lens, recommendations, strategy, and devil's advocate prompts.",
    },
    {
        "question": "How is Project Intel different from plagiarism detection?",
        "answer": "Plagiarism is only one signal. Project Intel combines semantic similarity, market context, competitor extraction, and strategic analysis to help position and improve your project.",
    },
    {
        "question": "How are competitors found in Project Intel?",
        "answer": "RealEye extracts smart context (functionality, location, industry), runs targeted web search, parses candidate projects, and ranks them by relevance to your project's core intent.",
    },
    {
        "question": "Why does similarity score change sometimes?",
        "answer": "Live web search can vary over time. RealEye reduces jitter using normalization, constrained market text windows, and stable score bucketing.",
    },
    {
        "question": "Is my data secure?",
        "answer": "RealEye uses account-scoped access and secured API processing. History and analysis retrieval are tied to the authenticated user.",
    },
    {
        "question": "Can I delete my history?",
        "answer": "Yes. In Project Intel history, use the delete action on an item. The backend validates ownership before removal.",
    },
    {
        "question": "Is this service free?",
        "answer": "Core features are currently available for registered users. Pricing tiers may evolve as capabilities expand.",
    },
]


class ChatService:
    @staticmethod
    def _merged_knowledge_base() -> List[Dict[str, str]]:
        db_rows = KnowledgeModel.get_all()
        merged: List[Dict[str, str]] = []
        seen: set[str] = set()

        for entry in BUILTIN_QA + db_rows:
            q = str(entry.get("question", "")).strip()
            a = str(entry.get("answer", "")).strip()
            if not q or not a:
                continue
            key = q.lower()
            if key in seen:
                continue
            seen.add(key)
            merged.append({"question": q, "answer": a})
        return merged

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
        knowledge_base = ChatService._merged_knowledge_base()
        return [entry["question"] for entry in knowledge_base]

    @staticmethod
    def find_answer(question: str) -> str:
        """
        Simple fuzzy matching for knowledge base.
        """
        knowledge_base = ChatService._merged_knowledge_base()
        q_norm = (question or "").strip().lower()
        if not q_norm:
            return "Ask me about deepfake detection, image checks, or Project Intel analysis."
        
        # 1. Exact match (case insensitive)
        for entry in knowledge_base:
            if entry["question"].lower() == q_norm:
                return entry["answer"]
        
        # 2. Fuzzy match
        questions = [entry["question"] for entry in knowledge_base]
        matches = difflib.get_close_matches(q_norm, [q.lower() for q in questions], n=1, cutoff=0.6)
        
        if matches:
            matched_q = matches[0]
            for entry in knowledge_base:
                if entry["question"].lower() == matched_q:
                    return entry["answer"]

        # 3. Simple keyword overlap fallback for broader phrasing
        q_tokens = {t for t in q_norm.replace("?", " ").split() if len(t) > 2}
        best: Optional[Dict[str, str]] = None
        best_score = 0
        for entry in knowledge_base:
            et = set(entry["question"].lower().replace("?", " ").split())
            overlap = len(q_tokens & et)
            if overlap > best_score:
                best_score = overlap
                best = entry
        if best and best_score >= 2:
            return best["answer"]
                    
        return "I'm not sure yet. Try asking about deepfake detection, image analysis, Project Intel, competitors, or how the system works."

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
