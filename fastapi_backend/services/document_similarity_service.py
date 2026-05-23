"""
Document discovery (Semantic Scholar + web PDF search) and passage-level overlap
via Hugging Face sentence-transformers/all-MiniLM-L6-v2 embeddings.
"""

from __future__ import annotations

import io
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from typing import Any, List, Optional, Tuple
from urllib.parse import quote_plus, urlparse

import numpy as np
import requests

from fastapi_backend.core.config import settings
from fastapi_backend.services.web_search import web_search
from fastapi_backend.utils.document_text import (
    search_keywords_from_text,
    strip_extraction_banner,
)

HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
# Academic Graph API — https://api.semanticscholar.org/graph/v1
S2_GRAPH_BASE = "https://api.semanticscholar.org/graph/v1"
S2_PAPER_SEARCH = f"{S2_GRAPH_BASE}/paper/search"
S2_RECOMMENDATIONS_BASE = "https://api.semanticscholar.org/recommendations/v1"
# Comma-separated, no spaces (per S2 API docs)
S2_PAPER_FIELDS = (
    "paperId,title,url,abstract,openAccessPdf,year,isOpenAccess,venue,tldr,"
    "externalIds,citationCount,publicationDate"
)
MATCH_THRESHOLD = 0.58
MAX_DOCS = 5
MAX_USER_CHUNKS = 35
MAX_SOURCE_CHUNKS_PER_DOC = 25
LARGE_DOC_CHARS = 18_000
LARGE_DOC_USER_CHUNKS = 12
LARGE_DOC_SOURCE_CHUNKS = 6
CHUNK_TARGET = 420
CHUNK_MAX = 520
MAX_SOURCE_TEXT = 4000
MAX_FETCH_BYTES = 2 * 1024 * 1024
FETCH_TIMEOUT_SEC = 8.0
USER_AGENT = "RealEye-ProjectIntel/1.0 (+https://github.com/realeye)"


@dataclass
class TextChunk:
    start: int
    end: int
    text: str


@dataclass
class SimilarDocument:
    id: str
    title: str
    url: str
    snippet: str
    document_type: str  # pdf | web | semantic_scholar
    source: str  # semantic_scholar | duckduckgo_pdf | semantic_scholar_recommendation
    paper_id: str = ""
    s2_url: str = ""
    year: Optional[int] = None
    venue: str = ""
    is_open_access: bool = False
    citation_count: int = 0


@dataclass
class DocumentMatch:
    user_start: int
    user_end: int
    matched_text: str
    source_document_id: str
    source_url: str
    source_title: str
    similarity: float
    source_excerpt: str = ""


@dataclass
class DocumentSimilarityResult:
    similar_documents: List[SimilarDocument] = field(default_factory=list)
    document_matches: List[DocumentMatch] = field(default_factory=list)
    analysis_note: str = ""


def _truncate(s: str, n: int) -> str:
    s = (s or "").strip()
    if len(s) <= n:
        return s
    return s[: n - 1] + "…"


def _clean_for_embed(text: str) -> str:
    text = (text or "").lower()
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^\w\s]", "", text)
    return text.strip()


def _normalize_url(url: str) -> str:
    u = (url or "").strip().rstrip("/")
    if u.startswith("http://"):
        u = "https://" + u[7:]
    return u.lower()


def _build_search_query(title: str, description: str, document_body: str = "") -> str:
    """
    Short keyword-style query for Semantic Scholar (full paragraphs return 0 results).
    """
    body = strip_extraction_banner((document_body or "").strip())
    body_kw = search_keywords_from_text(body, 28) if body else ""
    parts = [title.strip(), description.strip()[:200], body_kw]
    q = " ".join(p for p in parts if p)
    return _truncate(q, 200) or title.strip() or "research"


def _search_query_variants(title: str, description: str, document_body: str) -> List[str]:
    """Several queries to try when the first S2 search returns nothing."""
    primary = _build_search_query(title, description, document_body)
    variants = [primary]
    short = _truncate(f"{title} {description}".strip(), 200)
    if short and short not in variants:
        variants.append(short)
    if title.strip() and title.strip() not in variants:
        variants.append(title.strip())
    body = strip_extraction_banner((document_body or "").strip())
    if body:
        kw = search_keywords_from_text(body, 16)
        if kw and kw not in variants:
            variants.append(_truncate(kw, 120))
    return variants


def _arxiv_similar_documents(query: str, limit: int = 3) -> List[SimilarDocument]:
    """Fallback when Semantic Scholar returns no hits."""
    q = quote_plus(_truncate(query, 180))
    if not q:
        return []
    try:
        url = (
            "http://export.arxiv.org/api/query?"
            f"search_query=all:{q}&start=0&max_results={min(limit, 8)}&sortBy=relevance&sortOrder=descending"
        )
        res = requests.get(url, timeout=15, headers={"User-Agent": USER_AGENT})
        if not res.ok:
            return []
        root = ET.fromstring(res.text)
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        out: List[SimilarDocument] = []
        for i, entry in enumerate(root.findall("atom:entry", ns)):
            t_el = entry.find("atom:title", ns)
            title = (t_el.text or "").strip().replace("\n", " ") if t_el is not None else ""
            if not title:
                continue
            id_el = entry.find("atom:id", ns)
            abs_url = (id_el.text or "").strip() if id_el is not None else ""
            summary_el = entry.find("atom:summary", ns)
            snippet = (summary_el.text or "").strip().replace("\n", " ")[:300] if summary_el is not None else ""
            pdf_url = ""
            for link in entry.findall("atom:link", ns):
                if link.get("title") == "pdf" or (link.get("href") or "").endswith(".pdf"):
                    pdf_url = (link.get("href") or "").strip()
                    break
            page_url = abs_url or pdf_url
            if not page_url.startswith("http"):
                continue
            out.append(
                SimilarDocument(
                    id=f"doc-arxiv-{i}",
                    title=title[:200],
                    url=pdf_url or page_url,
                    snippet=snippet or "arXiv preprint",
                    document_type="pdf" if pdf_url else "arxiv",
                    source="arxiv",
                    s2_url="",
                )
            )
            if len(out) >= limit:
                break
        return out
    except Exception as e:
        print(f"document_similarity: arXiv search failed: {e}")
        return []


def _sample_large_document(text: str, max_chars: int = LARGE_DOC_CHARS) -> str:
    """Beginning + middle + end sample for fast matching on huge uploads."""
    if len(text) <= max_chars:
        return text
    part = max_chars // 3
    mid = max(0, len(text) // 2 - part // 2)
    return (
        f"{text[:part]}\n\n"
        f"[··· {len(text):,} characters omitted for analysis speed ···]\n\n"
        f"{text[mid : mid + part]}\n\n"
        f"[···]\n\n"
        f"{text[-part:]}"
    )


def _prepare_user_text(file_content: str) -> Tuple[str, bool, str]:
    """Returns (text for analysis, is_large_doc, optional_notice)."""
    raw = strip_extraction_banner((file_content or "").strip())
    if raw.startswith("(No document body"):
        raw = ""
    if len(raw) <= LARGE_DOC_CHARS:
        return raw, False, ""
    sampled = _sample_large_document(raw)
    notice = (
        f"Large upload (~{len(raw):,} characters): similar-document search uses the full "
        f"extract; passage matching uses a sample from the start, middle, and end so analysis "
        f"finishes in reasonable time. Use “Download original file” for the complete PDF."
    )
    return sampled, True, notice


def _discover_similar_documents(
    title: str, description: str, document_body: str, *, fast_mode: bool = False
) -> List[SimilarDocument]:
    """Semantic Scholar (+ recommendations), web PDF, arXiv fallbacks."""
    scholar: List[SimilarDocument] = []
    for q in _search_query_variants(title, description, document_body):
        scholar = _semantic_scholar_search(q, limit=4)
        if scholar:
            break

    recommendations: List[SimilarDocument] = []
    if not fast_mode and scholar and scholar[0].paper_id:
        recommendations = _semantic_scholar_recommendations(scholar[0].paper_id, limit=2)

    query = _build_search_query(title, description, document_body)
    pdfs = _duckduckgo_pdf_search(query, limit=3)
    if not pdfs:
        pdfs = _duckduckgo_pdf_search(_truncate(f"{title} {description}", 120), limit=3)

    documents = _merge_documents(scholar, recommendations, pdfs)
    if len(documents) < 2:
        arxiv = _arxiv_similar_documents(query, limit=4)
        documents = _merge_documents(documents, arxiv)
    return documents


def _s2_headers() -> dict[str, str]:
    headers: dict[str, str] = {"User-Agent": USER_AGENT}
    api_key = (getattr(settings, "SEMANTIC_SCHOLAR_API_KEY", "") or "").strip()
    if api_key:
        headers["x-api-key"] = api_key
    return headers


def _s2_get(url: str, params: dict[str, Any]) -> Optional[dict[str, Any] | list]:
    """GET from Semantic Scholar with one retry on 429."""
    import time

    headers = _s2_headers()
    for attempt in range(2):
        try:
            res = requests.get(url, params=params, headers=headers, timeout=20)
            if res.status_code == 429:
                print(
                    "document_similarity: Semantic Scholar rate limited "
                    "(set SEMANTIC_SCHOLAR_API_KEY in .env — https://www.semanticscholar.org/product/api)"
                )
                if attempt == 0:
                    time.sleep(2.5)
                    continue
                return None
            if not res.ok:
                # Recommendations often 400 for valid paper IDs; search still succeeds
                if "recommendations" in url and res.status_code in (400, 404):
                    pass
                else:
                    print(f"document_similarity: Semantic Scholar HTTP {res.status_code} {url}")
                return None
            return res.json()
        except Exception as e:
            print(f"document_similarity: Semantic Scholar request failed: {e}")
            return None
    return None


def _paper_to_similar_document(
    paper: dict,
    *,
    source: str,
    fallback_index: int = 0,
) -> Optional[SimilarDocument]:
    """Map an Academic Graph paper object to SimilarDocument (see S2 API response schema)."""
    if not isinstance(paper, dict):
        return None
    title = str(paper.get("title") or "").strip()
    if not title:
        return None

    paper_id = str(paper.get("paperId") or "").strip()
    abstract = str(paper.get("abstract") or "").strip()
    year_raw = paper.get("year")
    year: Optional[int] = int(year_raw) if isinstance(year_raw, int) else None
    venue = str(paper.get("venue") or "").strip()[:120]
    is_oa = bool(paper.get("isOpenAccess"))
    cites = paper.get("citationCount")
    citation_count = int(cites) if isinstance(cites, int) else 0

    tldr_obj = paper.get("tldr")
    tldr_text = ""
    if isinstance(tldr_obj, dict):
        tldr_text = str(tldr_obj.get("text") or "").strip()

    oa = paper.get("openAccessPdf") or {}
    pdf_url = ""
    if isinstance(oa, dict):
        pdf_url = str(oa.get("url") or "").strip()

    s2_page = str(paper.get("url") or "").strip()
    if not s2_page and paper_id:
        s2_page = f"https://www.semanticscholar.org/paper/{paper_id}"

    link = pdf_url or s2_page
    if not link.startswith("http"):
        return None

    if tldr_text:
        snippet = tldr_text[:300]
    elif abstract:
        snippet = abstract[:300]
    else:
        snippet = f"Academic paper{f' ({year})' if year else ''}."

    doc_type = "pdf" if pdf_url else "semantic_scholar"
    doc_id = f"doc-s2-{paper_id}" if paper_id else f"doc-s2-{fallback_index}"

    return SimilarDocument(
        id=doc_id,
        title=title[:200],
        url=link,
        snippet=snippet,
        document_type=doc_type,
        source=source,
        paper_id=paper_id,
        s2_url=s2_page,
        year=year,
        venue=venue,
        is_open_access=is_oa,
        citation_count=citation_count,
    )


def _papers_to_similar_documents(
    papers: list, limit: int, source: str = "semantic_scholar"
) -> List[SimilarDocument]:
    out: List[SimilarDocument] = []
    seen_ids: set[str] = set()
    seen_urls: set[str] = set()
    for i, paper in enumerate(papers):
        doc = _paper_to_similar_document(paper, source=source, fallback_index=i)
        if not doc:
            continue
        key = doc.paper_id or _normalize_url(doc.url)
        if key in seen_ids or _normalize_url(doc.url) in seen_urls:
            continue
        seen_ids.add(key)
        seen_urls.add(_normalize_url(doc.url))
        out.append(doc)
        if len(out) >= limit:
            break
    return out


def _semantic_scholar_search(query: str, limit: int = 3) -> List[SimilarDocument]:
    """
    Academic Graph: GET /graph/v1/paper/search
    Prefers open-access PDFs; falls back to unrestricted search.
    """
    q = _truncate(query, 300)
    if not q:
        return []

    param_sets = [
        {
            "query": q,
            "limit": min(limit, 10),
            "fields": S2_PAPER_FIELDS,
            "openAccessPdf": "",
        },
        {
            "query": q,
            "limit": min(limit, 10),
            "fields": S2_PAPER_FIELDS,
        },
    ]

    for params in param_sets:
        payload = _s2_get(S2_PAPER_SEARCH, params)
        if not isinstance(payload, dict):
            continue
        papers = payload.get("data")
        if not isinstance(papers, list):
            continue
        out = _papers_to_similar_documents(papers, limit, source="semantic_scholar")
        if out:
            return out
    return []


def _semantic_scholar_recommendations(seed_paper_id: str, limit: int = 2) -> List[SimilarDocument]:
    """
    Recommendations API: GET /recommendations/v1/papers/forpaper/{paperId}
    """
    pid = (seed_paper_id or "").strip()
    if not pid:
        return []

    url = f"{S2_RECOMMENDATIONS_BASE}/papers/forpaper/{pid}"
    payload = _s2_get(
        url,
        {
            "limit": min(limit, 10),
            "fields": S2_PAPER_FIELDS,
        },
    )
    if isinstance(payload, dict):
        papers = payload.get("recommendedPapers") or payload.get("data") or []
    elif isinstance(payload, list):
        papers = payload
    else:
        papers = []

    if not isinstance(papers, list):
        return []
    return _papers_to_similar_documents(papers, limit, source="semantic_scholar_recommendation")


def _duckduckgo_pdf_search(query: str, limit: int = 3) -> List[SimilarDocument]:
    """Web PDF discovery via DuckDuckGo filetype:pdf."""
    base = _truncate(query, 160)
    if not base:
        return []
    search_q = f"{base} filetype:pdf"
    results = web_search(search_q, max_results=max(limit + 2, 6))
    if not results:
        results = web_search(base, max_results=max(limit + 2, 6))

    out: List[SimilarDocument] = []
    seen: set[str] = set()
    url_re = re.compile(r"https?://[^\s)>\]]+", re.I)

    for r in results:
        href = str(r.get("href") or "").strip()
        if not href.startswith("http"):
            urls = url_re.findall(str(r.get("body") or "") + " " + str(r.get("title") or ""))
            href = urls[0] if urls else ""
        href = href.rstrip(".,;)")
        norm = _normalize_url(href)
        if not norm or norm in seen:
            continue
        # filetype:pdf search may return landing pages; keep links that look document-related
        doc_like = (
            ".pdf" in norm
            or "/pdf/" in norm
            or "arxiv.org" in norm
            or "researchgate.net" in norm
            or "academia.edu" in norm
            or "semanticscholar.org" in norm
            or "ieee.org" in norm
            or "springer.com" in norm
            or "sciencedirect.com" in norm
        )
        if not doc_like and "pdf" not in str(r.get("title") or "").lower():
            continue
        seen.add(norm)
        title = str(r.get("title") or "").strip()[:200]
        body = str(r.get("body") or "").strip()[:280]
        if not title:
            host = urlparse(href).netloc.replace("www.", "")
            title = host or "PDF document"
        out.append(
            SimilarDocument(
                id=f"doc-pdf-{len(out)}",
                title=title,
                url=href,
                snippet=body or "Web PDF source.",
                document_type="pdf",
                source="duckduckgo_pdf",
            )
        )
        if len(out) >= limit:
            break
    return out


def _merge_documents(*groups: List[SimilarDocument]) -> List[SimilarDocument]:
    merged: List[SimilarDocument] = []
    seen_urls: set[str] = set()
    seen_paper_ids: set[str] = set()
    for group in groups:
        for doc in group:
            if doc.paper_id and doc.paper_id in seen_paper_ids:
                continue
            norm = _normalize_url(doc.url)
            if not norm or norm in seen_urls:
                continue
            if doc.paper_id:
                seen_paper_ids.add(doc.paper_id)
            seen_urls.add(norm)
            merged.append(doc)
            if len(merged) >= MAX_DOCS:
                return merged
    return merged


def _fetch_bytes(url: str) -> Optional[bytes]:
    try:
        import httpx

        with httpx.Client(
            follow_redirects=True,
            timeout=FETCH_TIMEOUT_SEC,
            headers={"User-Agent": USER_AGENT},
        ) as client:
            res = client.get(url)
            if res.status_code != 200:
                return None
            data = res.content
            if len(data) > MAX_FETCH_BYTES:
                data = data[:MAX_FETCH_BYTES]
            return data
    except Exception as e:
        print(f"document_similarity: fetch failed {url[:80]}: {e}")
        return None


def _extract_pdf_text(data: bytes) -> str:
    try:
        import fitz

        doc = fitz.open(stream=data, filetype="pdf")
        parts: list[str] = []
        for page in doc:
            parts.append(page.get_text("text") or "")
        doc.close()
        return "\n".join(p.strip() for p in parts if p).strip()
    except Exception as e:
        print(f"document_similarity: PDF extract failed: {e}")
        return ""


def _extract_html_text(url: str, data: Optional[bytes] = None) -> str:
    try:
        import trafilatura

        if data:
            text = trafilatura.extract(data, url=url, include_comments=False, include_tables=False)
        else:
            downloaded = trafilatura.fetch_url(url)
            text = trafilatura.extract(downloaded, include_comments=False, include_tables=False)
        return (text or "").strip()
    except Exception as e:
        print(f"document_similarity: HTML extract failed {url[:60]}: {e}")
        return ""


def _fetch_document_text(doc: SimilarDocument, *, fast_mode: bool = True) -> str:
    """
    Source text for passage matching. Uses abstracts/snippets only (no remote PDF download)
    so analysis stays fast.
    """
    snippet = (doc.snippet or "").strip()
    if snippet:
        return snippet[:MAX_SOURCE_TEXT]

    url = (doc.url or "").strip()
    if fast_mode or not url:
        return ""

    lower_url = url.lower()
    if doc.document_type == "pdf" or lower_url.endswith(".pdf"):
        return snippet

    raw = _fetch_bytes(url)
    if not raw or raw[:5] == b"%PDF-":
        return snippet
    text = _extract_html_text(url, raw)
    return text[:MAX_SOURCE_TEXT] if text else snippet


def _chunk_text(full_text: str, max_chunks: int) -> List[TextChunk]:
    full_text = full_text or ""
    if not full_text.strip():
        return []

    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", full_text) if p.strip()]
    if not paragraphs:
        paragraphs = [full_text.strip()]

    pieces: List[str] = []
    for para in paragraphs:
        if len(para) <= CHUNK_MAX:
            pieces.append(para)
            continue
        sentences = re.split(r"(?<=[.!?])\s+", para)
        buf = ""
        for sent in sentences:
            if not sent.strip():
                continue
            if len(buf) + len(sent) + 1 <= CHUNK_TARGET:
                buf = f"{buf} {sent}".strip() if buf else sent.strip()
            else:
                if buf:
                    pieces.append(buf)
                buf = sent.strip()[:CHUNK_MAX]
        if buf:
            pieces.append(buf)

    chunks: List[TextChunk] = []
    offset = 0
    search_from = 0
    for piece in pieces:
        if len(chunks) >= max_chunks:
            break
        idx = full_text.find(piece, search_from)
        if idx < 0:
            idx = full_text.find(piece)
        if idx < 0:
            continue
        start = idx
        end = idx + len(piece)
        chunks.append(TextChunk(start=start, end=end, text=piece))
        search_from = end
    return chunks


def _embed_texts(texts: List[str]) -> Optional[np.ndarray]:
    token = (settings.HF_TOKEN or "").strip()
    if not token or not texts:
        return None
    cleaned: List[str] = []
    for t in texts:
        c = _clean_for_embed(_truncate(t, 450))
        if len(c) < 8:
            c = (c + " document text").strip()[:64]
        cleaned.append(c or "document text")

    try:
        from huggingface_hub import InferenceClient

        client = InferenceClient(provider="hf-inference", api_key=token)
        vectors: List[List[float]] = []
        batch_size = 8
        for i in range(0, len(cleaned), batch_size):
            batch = cleaned[i : i + batch_size]
            resp = client.feature_extraction(batch, model=HF_MODEL)
            batch_vecs = _parse_embedding_response(resp, len(batch))
            if batch_vecs is None:
                return None
            vectors.extend(batch_vecs)

        if len(vectors) != len(cleaned):
            return _embed_texts_one_by_one(client, cleaned)
        arr = np.array(vectors, dtype=np.float32)
        norms = np.linalg.norm(arr, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        return arr / norms
    except Exception as e:
        print(f"document_similarity: HF batch embeddings failed: {e}")
        try:
            from huggingface_hub import InferenceClient

            client = InferenceClient(provider="hf-inference", api_key=(settings.HF_TOKEN or "").strip())
            return _embed_texts_one_by_one(client, cleaned)
        except Exception as e2:
            print(f"document_similarity: HF embeddings failed: {e2}")
            return None


def _embed_texts_one_by_one(client: Any, cleaned: List[str]) -> Optional[np.ndarray]:
    vectors: List[List[float]] = []
    for text in cleaned:
        try:
            resp = client.feature_extraction(text, model=HF_MODEL)
            batch_vecs = _parse_embedding_response(resp, 1)
            if not batch_vecs:
                return None
            vectors.append(batch_vecs[0])
        except Exception:
            return None
    if len(vectors) != len(cleaned):
        return None
    arr = np.array(vectors, dtype=np.float32)
    norms = np.linalg.norm(arr, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return arr / norms


def _parse_embedding_response(resp: Any, expected: int) -> Optional[List[List[float]]]:
    """Normalize HF feature_extraction shapes to a list of vectors."""
    if resp is None:
        return None

    def _to_vec(item: Any) -> Optional[List[float]]:
        if isinstance(item, list):
            if not item:
                return None
            if isinstance(item[0], (int, float)):
                return [float(x) for x in item]
            if isinstance(item[0], list):
                # token-level: mean pool
                arr = np.array(item, dtype=np.float32)
                if arr.ndim == 2:
                    return arr.mean(axis=0).tolist()
        return None

    if isinstance(resp, list):
        if expected == 1 and resp and isinstance(resp[0], (int, float)):
            return [resp]
        out: List[List[float]] = []
        for item in resp:
            v = _to_vec(item)
            if v is None:
                return None
            out.append(v)
        return out if len(out) == expected else None

    v = _to_vec(resp)
    return [v] if v and expected == 1 else None


def _cosine_matrix(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    return np.clip(a @ b.T, -1.0, 1.0)


def _normalize_similarity_score(raw: float) -> float:
    if raw < 0:
        raw = (raw + 1) / 2.0
    return max(0.0, min(1.0, raw))


def _find_passage_matches_sentence_api(
    user_chunks: List[TextChunk],
    source_chunks: List[Tuple[str, TextChunk]],
    documents: List[SimilarDocument],
) -> List[DocumentMatch]:
    """Fallback when feature_extraction fails: pairwise sentence_similarity (capped)."""
    token = (settings.HF_TOKEN or "").strip()
    if not token:
        return []
    try:
        from huggingface_hub import InferenceClient

        client = InferenceClient(provider="hf-inference", api_key=token)
        doc_by_id = {d.id: d for d in documents}
        matches: List[DocumentMatch] = []
        max_sources = min(len(source_chunks), 40)
        for uchunk in user_chunks:
            sentence = _clean_for_embed(_truncate(uchunk.text, 450))
            if len(sentence) < 8:
                continue
            best_score = 0.0
            best_pair: Optional[Tuple[str, TextChunk]] = None
            for doc_id, schunk in source_chunks[:max_sources]:
                other = _clean_for_embed(_truncate(schunk.text, 450))
                if len(other) < 8:
                    continue
                scores = client.sentence_similarity(sentence, [other], model=HF_MODEL)
                if not scores:
                    continue
                raw = _normalize_similarity_score(float(scores[0]))
                if raw > best_score:
                    best_score = raw
                    best_pair = (doc_id, schunk)
            if best_score < MATCH_THRESHOLD or not best_pair:
                continue
            doc_id, schunk = best_pair
            doc = doc_by_id.get(doc_id)
            if not doc:
                continue
            matches.append(
                DocumentMatch(
                    user_start=uchunk.start,
                    user_end=uchunk.end,
                    matched_text=uchunk.text[:400],
                    source_document_id=doc_id,
                    source_url=doc.url,
                    source_title=doc.title,
                    similarity=round(best_score * 100.0, 1),
                    source_excerpt=schunk.text[:320],
                )
            )
        matches.sort(key=lambda m: (-m.similarity, m.user_start))
        return _merge_overlapping_matches(matches)
    except Exception as e:
        print(f"document_similarity: sentence_similarity fallback failed: {e}")
        return []


def _find_passage_matches(
    user_text: str,
    user_chunks: List[TextChunk],
    documents: List[SimilarDocument],
    source_texts: List[str],
    *,
    max_source_chunks_per_doc: int = MAX_SOURCE_CHUNKS_PER_DOC,
    allow_sentence_fallback: bool = True,
) -> List[DocumentMatch]:
    if not user_chunks or not documents:
        return []

    source_chunks: List[Tuple[str, TextChunk]] = []
    for doc, stext in zip(documents, source_texts):
        for ch in _chunk_text(stext, max_source_chunks_per_doc):
            source_chunks.append((doc.id, ch))

    if not source_chunks:
        return []

    user_embed_texts = [c.text for c in user_chunks]
    source_embed_texts = [c.text for _, c in source_chunks]

    user_emb = _embed_texts(user_embed_texts)
    source_emb = _embed_texts(source_embed_texts)
    if user_emb is None or source_emb is None:
        if not allow_sentence_fallback or len(user_chunks) > 18:
            return []
        return _find_passage_matches_sentence_api(
            user_chunks, source_chunks, documents
        )

    sim = _cosine_matrix(user_emb, source_emb)
    matches: List[DocumentMatch] = []
    doc_by_id = {d.id: d for d in documents}

    for ui, uchunk in enumerate(user_chunks):
        best_j = int(np.argmax(sim[ui]))
        best_score = float(sim[ui, best_j])
        if best_score < MATCH_THRESHOLD:
            continue
        doc_id, schunk = source_chunks[best_j]
        doc = doc_by_id.get(doc_id)
        if not doc:
            continue
        matches.append(
            DocumentMatch(
                user_start=uchunk.start,
                user_end=uchunk.end,
                matched_text=uchunk.text[:400],
                source_document_id=doc_id,
                source_url=doc.url,
                source_title=doc.title,
                similarity=round(best_score * 100.0, 1),
                source_excerpt=schunk.text[:320],
            )
        )

    matches.sort(key=lambda m: (-m.similarity, m.user_start))
    return _merge_overlapping_matches(matches)


def _merge_overlapping_matches(matches: List[DocumentMatch]) -> List[DocumentMatch]:
    if not matches:
        return []
    kept: List[DocumentMatch] = []
    for m in matches:
        overlap = False
        for k in kept:
            if m.source_document_id != k.source_document_id:
                continue
            if not (m.user_end <= k.user_start or m.user_start >= k.user_end):
                if m.similarity > k.similarity:
                    kept.remove(k)
                    kept.append(m)
                overlap = True
                break
        if not overlap:
            kept.append(m)
    kept.sort(key=lambda x: x.user_start)
    return kept[:40]


def compute_document_similarity(
    title: str,
    description: str,
    file_content: str,
) -> DocumentSimilarityResult:
    """
    Discover similar PDFs/papers and highlight overlapping passages in the user's text.
    """
    raw_text = strip_extraction_banner((file_content or "").strip())
    user_text, fast_mode, analysis_note = _prepare_user_text(raw_text)

    documents = _discover_similar_documents(
        title, description, user_text or raw_text, fast_mode=fast_mode
    )

    if not documents:
        return DocumentSimilarityResult(analysis_note=analysis_note)

    if len(user_text) < 40:
        return DocumentSimilarityResult(
            similar_documents=documents, analysis_note=analysis_note
        )

    max_user = LARGE_DOC_USER_CHUNKS if fast_mode else MAX_USER_CHUNKS
    max_source = LARGE_DOC_SOURCE_CHUNKS if fast_mode else MAX_SOURCE_CHUNKS_PER_DOC

    user_chunks = _chunk_text(user_text, max_user)
    if not user_chunks:
        return DocumentSimilarityResult(
            similar_documents=documents, analysis_note=analysis_note
        )

    source_texts: List[str] = []
    for doc in documents:
        text = _fetch_document_text(doc, fast_mode=True)
        if not text or len(text) < 24:
            text = (doc.snippet or "")[:MAX_SOURCE_TEXT]
        source_texts.append(text)

    matches = _find_passage_matches(
        user_text,
        user_chunks,
        documents,
        source_texts,
        max_source_chunks_per_doc=max_source,
        allow_sentence_fallback=not fast_mode,
    )
    return DocumentSimilarityResult(
        similar_documents=documents,
        document_matches=matches,
        analysis_note=analysis_note,
    )
