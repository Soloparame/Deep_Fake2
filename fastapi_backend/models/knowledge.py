from fastapi_backend.database import knowledge_col
from typing import Optional, Dict, Any, List
import uuid

class KnowledgeModel:
    """
    MongoDB Model for Knowledge Base operations.
    """
    
    @staticmethod
    def get_all() -> List[Dict[str, Any]]:
        """Fetch all Q&A pairs to search in memory (efficient for small datasets)"""
        try:
            return list(knowledge_col.find({}))
        except Exception:
            return []

    @staticmethod
    def add_entry(question: str, answer: str) -> Dict[str, Any]:
        """Add a new Q&A pair"""
        doc = {
            "id": str(uuid.uuid4()),
            "question": question,
            "answer": answer
        }
        knowledge_col.insert_one(doc)
        return doc
        
    @staticmethod
    def seed_defaults():
        """Seed the database with default questions if empty"""
        if knowledge_col.count_documents({}) == 0:
            defaults = [
                {
                    "question": "What is deepfake?",
                    "answer": "A deepfake is AI-generated fake media (video or audio) that replaces a person's likeness with someone else's, often used for misinformation or entertainment."
                },
                {
                    "question": "How can I detect a deepfake?",
                    "answer": "You can use our 'Detect' feature! Upload a video, and our AI model will analyze facial artifacts, blinking patterns, and inconsistencies to determine if it's real or fake."
                },
                {
                    "question": "Is this service free?",
                    "answer": "Yes, the basic detection and chat features are currently free for all registered users."
                },
                {
                    "question": "How accurate is the detection?",
                    "answer": "Our model is trained on thousands of videos and typically achieves high accuracy (around 90%+), but no AI is perfect. Always verify with other sources."
                },
                {
                    "question": "Can I report a harmful video?",
                    "answer": "Yes, if you find a harmful deepfake, please contact support or use the report feature (coming soon)."
                },
                 {
                    "question": "Who created RealEye?",
                    "answer": "RealEye was built by a team of dedicated developers to help combat digital misinformation."
                }
            ]
            for d in defaults:
                KnowledgeModel.add_entry(d["question"], d["answer"])
            print("✅ Knowledge base seeded with default Q&A.")
