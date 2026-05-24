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
        Aggressively integrates multiple layers for online plagiarism checking.
        Calculates source percentages based on sentence-level overlap.
        """
        sources = []
        
        # 0. Enhanced Text Cleaning for Search
        clean_text = text.replace('\xad', '').replace('-\n', '')
        clean_text = re.sub(r'\s+', ' ', clean_text)
        
        # Extract potential search snippets (long and unique)
        all_sentences = [s.strip() for s in re.split(r'[.!?\n]', clean_text) if len(s.strip()) > 50]
        all_sentences = sorted(list(set(all_sentences)), key=len, reverse=True)
        
        if not all_sentences:
            return {"internet_percent": 0.0, "publications_percent": 0.0, "sources": []}

        # Take top 10 sentences for search
        search_queries = all_sentences[:10]
        total_queries = len(search_queries)
        
        # track which sentences matched which domain
        sentence_matches = {} # domain -> set of sentence indices
        domain_links = {} # domain -> actual URL
        domain_types = {} # domain -> "Internet Source" | "Publication"

        print(f"--- Running Precision Check ({total_queries} queries) ---")

        # 1. Semantic Scholar API
        semantic_scholar_api_key = os.getenv("SEMANTIC_SCHOLAR_API_KEY")
        if semantic_scholar_api_key and len(semantic_scholar_api_key) > 10:
            try:
                headers = {"x-api-key": semantic_scholar_api_key}
                for i, snippet in enumerate(search_queries[:4]):
                    url = f"https://api.semanticscholar.org/graph/v1/paper/search?query={snippet[:100]}&limit=3&fields=title,url"
                    res = requests.get(url, headers=headers, timeout=10)
                    if res.status_code == 200:
                        for paper in res.json().get("data", []):
                            title = paper.get("title", "Publication")
                            if title not in sentence_matches: sentence_matches[title] = set()
                            sentence_matches[title].add(i)
                            domain_links[title] = paper.get("url")
                            domain_types[title] = "Publication"
            except Exception: pass

        # 2. DuckDuckGo Search (Primary Engine)
        try:
            from duckduckgo_search import DDGS
            with DDGS() as ddgs:
                for i, query in enumerate(search_queries):
                    # Try Exact Phrase, then Broad
                    modes = ["exact", "broad"] if i < 5 else ["broad"]
                    for mode in modes:
                        search_term = f'"{query[:120]}"' if mode == "exact" else query[:100]
                        try:
                            results = list(ddgs.text(search_term, max_results=3))
                            if not results: continue
                            
                            for r in results:
                                href = r.get("href", "")
                                if not href or any(x in href for x in ["google.com", "bing.com", "dictionary.", "imdb.", "merriam-"]): continue
                                
                                domain = href.split('/')[2] if "http" in href else "Web Source"
                                if domain not in sentence_matches: sentence_matches[domain] = set()
                                sentence_matches[domain].add(i)
                                domain_links[domain] = href
                                if domain not in domain_types: domain_types[domain] = "Internet Source"
                                print(f"    [FOUND] {domain} matches sentence {i+1}")
                            
                            if results: break 
                        except Exception: continue
        except Exception: pass

        # Aggregate Results
        formatted_sources = []
        unique_matched_sentences = set()
        
        for domain, matched_indices in sentence_matches.items():
            # Percentage = (sentences matched / total queries) * 100
            # We add a small weight if multiple sentences match the same domain
            match_count = len(matched_indices)
            percent = (match_count / total_queries) * 100
            
            # Cap at reasonable realistic levels for snippet matches
            percent = round(min(98.0, percent + (match_count * 2)), 1)
            
            formatted_sources.append({
                "name": domain,
                "percent": percent,
                "type": domain_types.get(domain, "Internet Source"),
                "link": domain_links.get(domain)
            })
            unique_matched_sentences.update(matched_indices)

        # Calculate overall internet % based on unique sentence matches
        internet_percent = (len(unique_matched_sentences) / total_queries) * 100
        
        # Split publications vs internet for the header boxes
        pub_percent = sum(s["percent"] for s in formatted_sources if s["type"] == "Publication")
        int_percent = sum(s["percent"] for s in formatted_sources if s["type"] == "Internet Source")
        
        # Normalize headers
        total_online = internet_percent
        pub_header = min(total_online, (pub_percent / (pub_percent + int_percent + 0.1)) * total_online)
        int_header = total_online - pub_header

        return {
            "internet_percent": round(int_header, 1),
            "publications_percent": round(pub_header, 1),
            "sources": sorted(formatted_sources, key=lambda x: x["percent"], reverse=True)
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
