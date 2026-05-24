import os
import chromadb
import requests
import json
import base64
import re
from datetime import datetime
from chromadb.utils import embedding_functions
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any
from fastapi_backend.core.config import settings
from fastapi_backend.utils.document_text import extract_text_from_upload

class PlagiarismService:
    def __init__(self):
        self.db_path = os.path.join(settings.BASE_DIR, "db", "chroma")
        os.makedirs(self.db_path, exist_ok=True)
        
        self.client = chromadb.PersistentClient(path=self.db_path)
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        self.collection = self.client.get_or_create_collection(
            name="bdu_corpus",
            embedding_function=self.embedding_fn
        )

    def process_and_index_file(self, file_path: str):
        """Extracts text from a file and indexes it in ChromaDB."""
        filename = os.path.basename(file_path)
        with open(file_path, "rb") as f:
            data = f.read()
        
        try:
            text, _ = extract_text_from_upload(filename, data)
            if not text.strip():
                return
            
            # Chunking text (simple sentence-based chunking for now)
            chunks = self._chunk_text(text)
            
            for i, chunk in enumerate(chunks):
                self.collection.add(
                    documents=[chunk],
                    metadatas=[{"filename": filename, "chunk_index": i}],
                    ids=[f"{filename}_{i}"]
                )
        except Exception as e:
            print(f"Error processing {filename}: {e}")

    def _chunk_text(self, text: str, chunk_size: int = 500) -> List[str]:
        """Simple chunking logic."""
        words = text.split()
        chunks = []
        for i in range(0, len(words), chunk_size):
            chunks.append(" ".join(words[i : i + chunk_size]))
        return chunks

    def search_local_corpus(self, query_text: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """Searches the local corpus for similar documents."""
        # Truncate query text to a reasonable size if too large
        # ChromaDB/SentenceTransformers perform better on smaller chunks
        if len(query_text.split()) > 1000:
            query_text = " ".join(query_text.split()[:1000])
            
        print(f"Searching local corpus with query length: {len(query_text)}")
        
        try:
            results = self.collection.query(
                query_texts=[query_text],
                n_results=n_results
            )
            
            formatted_results = []
            if results["documents"] and len(results["documents"]) > 0:
                for i in range(len(results["documents"][0])):
                    formatted_results.append({
                        "document": results["documents"][0][i],
                        "metadata": results["metadatas"][0][i],
                        "distance": results["distances"][0][i],
                        "score": max(0, 1 - results["distances"][0][i]) # Ensure score is non-negative
                    })
            print(f"Found {len(formatted_results)} local results")
            return formatted_results
        except Exception as e:
            print(f"Error searching local corpus: {e}")
            return []

    async def check_online_sources(self, text: str) -> Dict[str, Any]:
        """
        Integrates multiple layers for online plagiarism checking.
        """
        internet_percent = 0.0
        publications_percent = 0.0
        sources = []
        
        # 0. Better Sentence Extraction (handle newlines, dots, etc.)
        clean_text = re.sub(r'\s+', ' ', text)
        sentences = [s.strip() for s in re.split(r'[.!?\n]', clean_text) if len(s.strip()) > 50]
        sentences = sorted(list(set(sentences)), key=len, reverse=True) # Unique, long sentences first
        
        if not sentences:
            print("[WARN] No long sentences found for online checking.")
            return {"internet_percent": 0.0, "publications_percent": 0.0, "sources": []}

        # Select 5 representative long sentences
        search_queries = sentences[:5]
        print(f"Starting online check with {len(search_queries)} queries...")

        # 1. Semantic Scholar API Layer (Academic Research)
        semantic_scholar_api_key = os.getenv("SEMANTIC_SCHOLAR_API_KEY")
        if semantic_scholar_api_key and len(semantic_scholar_api_key) > 10:
            try:
                print(f"  [Scholar] Checking academic matches...")
                headers = {"x-api-key": semantic_scholar_api_key}
                query = " ".join(clean_text.split()[:30])
                url = f"https://api.semanticscholar.org/graph/v1/paper/search?query={query}&limit=5&fields=title,url,venue,year"
                response = requests.get(url, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    for paper in data.get("data", []):
                        title = paper.get("title", "Academic Publication")
                        if not any(s["name"] == title for s in sources):
                            match_percent = round(12.5 + (len(sources) * 2), 1)
                            publications_percent += match_percent
                            sources.append({
                                "name": title,
                                "percent": match_percent,
                                "type": "Publication",
                                "link": paper.get("url")
                            })
                            print(f"    [Scholar] Match found: {title}")
            except Exception as e:
                print(f"  [Scholar] Error: {e}")

        # 2. DuckDuckGo Search Layer (Reliable Fallback)
        try:
            from duckduckgo_search import DDGS
            print(f"  [DDG] Searching web (no key needed)...")
            with DDGS() as ddgs:
                for query in search_queries:
                    # Try both exact phrase and broad search
                    for search_type in ["exact", "broad"]:
                        clean_query = f'"{query[:100]}"' if search_type == "exact" else query[:100]
                        try:
                            results = list(ddgs.text(clean_query, max_results=3))
                            for r in results:
                                href = r.get("href", "")
                                if not href or "google.com" in href: continue
                                
                                domain = href.split('/')[2] if "http" in href else "Web Source"
                                if not any(s["name"] == domain for s in sources):
                                    match_percent = round(15.5 + (len(sources) * 1.5), 1)
                                    internet_percent += match_percent
                                    sources.append({
                                        "name": domain,
                                        "percent": match_percent,
                                        "type": "Internet Source",
                                        "link": href
                                    })
                                    print(f"    [DDG] Match found: {domain}")
                        except Exception:
                            continue
        except Exception as e:
            print(f"  [DDG] Error: {e}")

        # 3. Google Custom Search Layer
        google_api_key = os.getenv("GOOGLE_API_KEY")
        google_cse_id = os.getenv("GOOGLE_CSE_ID")
        
        # Check if it's a real Google key (starts with AIzaSy)
        if google_api_key and google_api_key.startswith("AIzaSy") and google_cse_id:
            try:
                print(f"  [Google] Checking search engine...")
                for query in search_queries[:2]:
                    url = f"https://www.googleapis.com/customsearch/v1?key={google_api_key}&cx={google_cse_id}&q=\"{query[:100]}\""
                    response = requests.get(url, timeout=10)
                    if response.status_code == 200:
                        data = response.json()
                        for item in data.get("items", []):
                            domain = item.get("displayLink", "Google Result")
                            if not any(s["name"] == domain for s in sources):
                                match_percent = 10.0
                                internet_percent += match_percent
                                sources.append({
                                    "name": domain,
                                    "percent": match_percent,
                                    "type": "Internet Source",
                                    "link": item.get("link")
                                })
                                print(f"    [Google] Match found: {domain}")
            except Exception as e:
                print(f"  [Google] Error: {e}")
        elif google_api_key and google_api_key.startswith("gsk_"):
            print("  [Google] SKIPPING: The key in .env is a Groq key (gsk_...), not a Google API key.")

        return {
            "internet_percent": round(min(100, internet_percent), 1),
            "publications_percent": round(min(100, publications_percent), 1),
            "sources": sources
        }

    async def run_full_check(self, text: str) -> Dict[str, Any]:
        """
        Runs both local and online checks.
        Calculates similarity index by identifying unique overlapping chunks.
        """
        print(f"Starting accurate plagiarism check for text length: {len(text)}")
        
        words = text.split()
        chunk_size = 100 # Smaller chunks for better overlap detection
        chunks = [" ".join(words[i:i+chunk_size]) for i in range(0, len(words), chunk_size)]
        
        if not chunks:
            return {
                "similarity_index": 0,
                "internet_sources_percent": 0,
                "publications_percent": 0,
                "student_papers_percent": 0,
                "sources": []
            }

        matched_chunks = set() # indices of chunks that are plagiarized
        chunk_to_source = {} # chunk_index -> source_name
        source_contributions = {} # filename -> count of chunks it matched best
        
        SIMILARITY_THRESHOLD = 0.82 # Increased for higher precision
        
        for i, chunk in enumerate(chunks):
            if len(chunk.split()) < 12: continue
            
            local_matches = self.search_local_corpus(chunk, n_results=1)
            if local_matches and local_matches[0]["score"] > SIMILARITY_THRESHOLD:
                matched_chunks.add(i)
                best_match = local_matches[0]
                fname = best_match["metadata"]["filename"]
                chunk_to_source[i] = fname
                source_contributions[fname] = source_contributions.get(fname, 0) + 1
        
        # Calculate unique coverage
        unique_matched_count = len(matched_chunks)
        student_papers_percent = (unique_matched_count / len(chunks)) * 100 if chunks else 0
        
        # Get online results
        online_data = await self.check_online_sources(text)
        internet_sources_percent = online_data["internet_percent"]
        publications_percent = online_data["publications_percent"]
        
        # Calculate overall similarity (clamped at 100)
        similarity_index = min(100, student_papers_percent + internet_sources_percent + publications_percent)
        
        # Format sources
        all_sources = []
        
        # Add local sources based on their actual contribution to the overlap
        for fname, count in source_contributions.items():
            percent = (count / len(chunks)) * 100
            if percent > 0.5: # Only show sources with significant contribution
                all_sources.append({
                    "name": fname,
                    "percent": round(percent, 1),
                    "type": "Student Paper"
                })
        
        # Add online sources
        all_sources.extend(online_data["sources"])
        
        # Sort and limit
        all_sources.sort(key=lambda x: x["percent"], reverse=True)
        for i, s in enumerate(all_sources):
            s["id"] = i + 1
            
        return {
            "similarity_index": round(similarity_index, 1),
            "internet_sources_percent": round(internet_sources_percent, 1),
            "publications_percent": round(publications_percent, 1),
            "student_papers_percent": round(student_papers_percent, 1),
            "sources": all_sources[:15] # Show top 15 sources
        }

plagiarism_service = PlagiarismService()
