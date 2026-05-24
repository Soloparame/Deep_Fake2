"""
Compare Project Intel uploads against the Bahir Dar document corpus in MongoDB
(`deepfake_db.bahirdar_documents`).
"""

from __future__ import annotations

import datetime
import os
import re
import uuid
from difflib import SequenceMatcher
from typing import Dict, List, Optional, Set, Tuple

from fastapi_backend.database import bahirdar_documents_col, mongo_is_connected, new_id
from fastapi_backend.services.document_similarity_service import (
    LARGE_DOC_CHARS,
    SimilarDocument,
    _sample_large_document,
    _truncate,
)
from fastapi_backend.utils.document_text import extract_text_from_upload, search_keywords_from_text

MAX_CORPUS_MATCHES = 2
CORPUS_COMPARE_CHARS = 6_000


def _doc_key(doc: dict) -> str:
    raw_id = doc.get("id")
    if raw_id is not None and str(raw_id).strip():
        return str(raw_id).strip()
    oid = doc.get("_id")
    if oid is not None:
        return str(oid)
    return ""


def _doc_title(doc: dict) -> str:
    title = (doc.get("title") or "").strip()
    if title:
        return title[:200]
    path = (doc.get("file_path") or "").strip()
    if path:
        return os.path.basename(path)[:200]
    return "Untitled Bahir Dar document"


def _doc_snippet(doc: dict, similarity_percent: float) -> str:
    parts: List[str] = [f"{similarity_percent:.1f}% similar to your upload"]
    author = (doc.get("author") or "").strip()
    year = doc.get("year")
    if author:
        parts.append(f"Author: {author}")
    if year:
        parts.append(f"Year: {year}")
    content = (doc.get("content") or "").strip()
    if content:
        parts.append(_truncate(content, 220))
    return " · ".join(parts)


def _corpus_text(doc: dict) -> str:
    text = (doc.get("content") or "").strip()
    if len(text) > LARGE_DOC_CHARS:
        return _sample_large_document(text)
    return text


def _keyword_prefilter(query: str, docs: List[dict], limit: int = 20) -> List[dict]:
    """Cheap title/content keyword filter before embedding (55-doc corpus)."""
    keywords = search_keywords_from_text(query, 24).lower().split()
    if not keywords:
        return docs[:limit]

    scored: List[Tuple[int, dict]] = []
    for doc in docs:
        hay = f"{_doc_title(doc)} {(doc.get('content') or '')[:4000]}".lower()
        score = sum(1 for kw in keywords if kw in hay)
        scored.append((score, doc))

    scored.sort(key=lambda x: (-x[0], _doc_title(x[1])))
    top = [d for s, d in scored if s > 0][:limit]
    return top if top else [d for _, d in scored[:limit]]


def _token_set(text: str) -> Set[str]:
    words = re.findall(r"[a-z0-9]{3,}", (text or "").lower())
    return {w for w in words if w not in {"the", "and", "for", "with", "this", "that", "from", "have", "has"}}


def _keyword_overlap_percent(user_text: str, corpus_text: str) -> float:
    a = _token_set(user_text)
    b = _token_set(corpus_text)
    if not a or not b:
        return 0.0
    overlap = len(a & b)
    union = len(a | b)
    return round((overlap / union) * 100.0, 1) if union else 0.0


def _normalize_compare(text: str) -> str:
    text = (text or "").lower()
    text = re.sub(r"[^\w\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _document_similarity_percent(user_text: str, corpus_text: str) -> float:
    """Reliable overlap for corpus docs (works for exact/near-exact uploads)."""
    user_sample = _normalize_compare(_truncate(user_text, CORPUS_COMPARE_CHARS))
    corpus_sample = _normalize_compare(_truncate(corpus_text, CORPUS_COMPARE_CHARS))
    if len(user_sample) < 20 or len(corpus_sample) < 20:
        return _keyword_overlap_percent(user_text, corpus_text)

    ratio = SequenceMatcher(None, user_sample, corpus_sample).ratio()

    # Same document (or large chunk copied): user text appears inside corpus
    probe = user_sample[: min(4000, len(user_sample))]
    if len(probe) >= 80 and probe in corpus_sample:
        contained = len(probe) / max(len(user_sample), 1)
        ratio = max(ratio, 0.55 + 0.45 * min(contained, 1.0))

    # Corpus excerpt inside upload (partial reuse)
    if len(corpus_sample) >= 80:
        cprobe = corpus_sample[:4000]
        if cprobe in user_sample:
            ratio = max(ratio, 0.75)

    kw = _keyword_overlap_percent(user_text, corpus_text) / 100.0
    ratio = max(ratio, kw)

    return round(max(0.0, min(100.0, ratio * 100.0)), 1)


def _quick_exact_boost(user_text: str, doc: dict, text: str) -> float:
    """Fast check for same file / copy-paste from corpus."""
    nu = _normalize_compare(_truncate(user_text, 8000))
    nc = _normalize_compare(_truncate(text, 8000))
    if len(nu) < 50 or len(nc) < 50:
        return 0.0
    if nu == nc:
        return 100.0
    probe = nu[: min(3500, len(nu))]
    if len(probe) >= 100 and probe in nc:
        return min(100.0, 70.0 + 30.0 * (len(probe) / max(len(nu), 1)))
    return 0.0


def find_similar_bahirdar_documents(
    title: str,
    description: str,
    user_text: str,
    *,
    limit: int = MAX_CORPUS_MATCHES,
) -> Tuple[List[SimilarDocument], Dict[str, str]]:
    """
    Rank corpus documents by semantic similarity to the uploaded text.
    Returns SimilarDocument items (source=bahirdar_documents) and id→text for passage matching.
    """
    if not mongo_is_connected():
        return [], {}

    try:
        corpus = list(
            bahirdar_documents_col.find(
                {},
                {
                    "title": 1,
                    "file_path": 1,
                    "id": 1,
                    "author": 1,
                    "year": 1,
                    "content": {"$substr": ["$content", 0, 12000]},
                },
            )
        )
    except Exception as e:
        print(f"bahirdar_corpus: load failed: {e}")
        return [], {}

    if not corpus:
        return [], {}

    query = f"{title}\n{description}\n{user_text}".strip()
    title_l = (title or "").strip().lower()

    candidate_docs: List[dict] = []
    seen_keys: set[str] = set()

    for doc in corpus:
        key = _doc_key(doc)
        if not key or key in seen_keys:
            continue
        dt = _doc_title(doc).lower()
        if title_l and (title_l in dt or dt in title_l):
            seen_keys.add(key)
            candidate_docs.append(doc)

    for doc in _keyword_prefilter(query, corpus, limit=max(limit * 5, 12)):
        key = _doc_key(doc)
        if key and key not in seen_keys:
            seen_keys.add(key)
            candidate_docs.append(doc)

    if len(candidate_docs) < limit:
        for doc in corpus:
            key = _doc_key(doc)
            if key and key not in seen_keys:
                seen_keys.add(key)
                candidate_docs.append(doc)
            if len(candidate_docs) >= limit * 4:
                break

    ranked: List[Tuple[float, dict, str]] = []
    for doc in candidate_docs:
        text = _corpus_text(doc)
        boost = _quick_exact_boost(user_text or query, doc, text)
        if boost >= 99.0:
            pct = boost
        else:
            pct = _document_similarity_percent(user_text or query, text)
        ranked.append((max(pct, boost), doc, text))

    ranked.sort(key=lambda x: (-x[0], _doc_title(x[1])))
    top = ranked[:limit]

    similar: List[SimilarDocument] = []
    texts: Dict[str, str] = {}
    used_keys: set[str] = set()
    for pct, doc, text in top:
        key = _doc_key(doc) or str(uuid.uuid4())
        if key in used_keys:
            continue
        used_keys.add(key)

        full_doc = bahirdar_documents_col.find_one(
            {"_id": doc["_id"]} if doc.get("_id") is not None else {"id": doc.get("id")},
            {"content": 1},
        )
        if full_doc and (full_doc.get("content") or "").strip():
            text = _corpus_text(full_doc)
            if pct < 99.0:
                pct = max(pct, _document_similarity_percent(user_text or query, text))
                boost = _quick_exact_boost(user_text or query, doc, text)
                pct = max(pct, boost)

        doc_id = f"bahirdar-{key}"
        file_path = (doc.get("file_path") or "").strip()
        similar.append(
            SimilarDocument(
                id=doc_id,
                title=_doc_title(doc),
                url=file_path or f"bahirdar://{key}",
                snippet=_doc_snippet(doc, pct),
                document_type="corpus",
                source="bahirdar_documents",
                year=doc.get("year"),
                similarity_percent=pct,
            )
        )
        texts[doc_id] = text

    return similar, texts


def ingest_file(path: str, *, skip_existing: bool = True) -> Optional[str]:
    """Extract text from a PDF/DOCX and insert into bahirdar_documents."""
    if not mongo_is_connected():
        raise RuntimeError("MongoDB is not connected — set MONGO_URI in fastapi_backend/.env")

    path = os.path.abspath(path)
    if not os.path.isfile(path):
        raise FileNotFoundError(path)

    filename = os.path.basename(path)
    if skip_existing:
        existing = bahirdar_documents_col.find_one({"file_path": path})
        if not existing:
            existing = bahirdar_documents_col.find_one({"title": os.path.splitext(filename)[0]})
        if existing:
            return _doc_key(existing)

    with open(path, "rb") as f:
        raw = f.read()

    content, _kind = extract_text_from_upload(filename, raw)
    if not (content or "").strip():
        raise ValueError(f"No text extracted from {filename}")

    doc_id = new_id()
    record = {
        "id": doc_id,
        "title": os.path.splitext(filename)[0],
        "file_path": path,
        "content": content[:500_000],
        "author": "",
        "year": None,
        "created_at": datetime.datetime.utcnow().isoformat(),
    }
    bahirdar_documents_col.insert_one(record)
    return doc_id


def ingest_folder(folder_path: str, *, skip_existing: bool = True) -> Tuple[int, int, List[str]]:
    """Bulk-ingest PDF/DOCX files from a folder into bahirdar_documents."""
    folder_path = os.path.abspath(folder_path)
    if not os.path.isdir(folder_path):
        raise NotADirectoryError(folder_path)

    added = 0
    skipped = 0
    errors: List[str] = []
    for name in sorted(os.listdir(folder_path)):
        lower = name.lower()
        if not (lower.endswith(".pdf") or lower.endswith(".docx")):
            continue
        full = os.path.join(folder_path, name)
        try:
            if skip_existing:
                title = os.path.splitext(name)[0]
                if bahirdar_documents_col.find_one({"file_path": full}) or bahirdar_documents_col.find_one(
                    {"title": title}
                ):
                    skipped += 1
                    continue
            ingest_file(full, skip_existing=False)
            added += 1
        except Exception as e:
            errors.append(f"{name}: {e}")

    return added, skipped, errors
