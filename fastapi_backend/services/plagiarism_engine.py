"""
Six-source plagiarism pipeline: 2 database + 2 online (DDGS) + 2 publications (Semantic Scholar).
Sentence-level fuzzy matching via difflib.SequenceMatcher for highlights.
"""

from __future__ import annotations

import re
import uuid
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from difflib import SequenceMatcher
from typing import List, Literal, Optional, Tuple

from fastapi_backend.services.bahirdar_corpus_service import find_similar_bahirdar_documents
from fastapi_backend.services.document_similarity_service import (
    DocumentMatch,
    DocumentSimilarityResult,
    SimilarDocument,
    _build_search_query,
    _extract_html_text,
    _fetch_bytes,
    _paper_to_similar_document,
    _s2_get,
    _search_query_variants,
    _semantic_scholar_search,
    _truncate,
)
from fastapi_backend.services.web_search import web_search
from fastapi_backend.utils.document_text import strip_extraction_banner

S2_PAPER_SEARCH = "https://api.semanticscholar.org/graph/v1/paper/search"
S2_PAPER_FIELDS = (
    "paperId,title,url,abstract,openAccessPdf,year,isOpenAccess,venue,tldr,"
    "externalIds,citationCount,publicationDate"
)

DB_LIMIT = 2
WEB_LIMIT = 2
PUB_LIMIT = 2
FUZZY_THRESHOLD = 0.60
MAX_WEB_CANDIDATES = 8
MAX_URL_SCRAPES = 2
WEB_SCRAPE_CHARS = 8_000
MAX_SOURCE_TEXT = 50_000
MAX_FETCH_BYTES = 2 * 1024 * 1024
USER_AGENT = "RealEye-ProjectIntel/1.0"

SourceType = Literal["database", "online", "publication"]

SOURCE_COLORS = {
    "database": "#ff4d4d",
    "online": "#3b82f6",
    "publication": "#22c55e",
}


@dataclass
class PlagiarismSource:
    id: str
    type: SourceType
    title: str
    link: str
    text: str
    similarity_percent: float = 0.0


@dataclass
class HighlightSegment:
    segment: str
    is_plagiarized: bool
    start_index: int = 0
    end_index: int = 0
    source_id: str = ""
    source_title: str = ""
    source_type: str = ""
    similarity: float = 0.0
    color: str = ""


@dataclass
class PlagiarismSummary:
    db_matches: int = 0
    web_matches: int = 0
    pub_matches: int = 0
    total_plagiarism_percent: float = 0.0


@dataclass
class PlagiarismEngineResult:
    summary: PlagiarismSummary = field(default_factory=PlagiarismSummary)
    highlighted_segments: List[HighlightSegment] = field(default_factory=list)
    sources_list: List[PlagiarismSource] = field(default_factory=list)
    similar_documents: List[SimilarDocument] = field(default_factory=list)
    document_matches: List[DocumentMatch] = field(default_factory=list)
    analysis_note: str = ""


def _split_sentences(text: str) -> List[Tuple[str, int, int]]:
    """Return (sentence, start, end) tuples preserving indices in original text."""
    text = text or ""
    if not text.strip():
        return []

    pattern = re.compile(r"(?<=[.!?])\s+|\n+")
    parts: List[Tuple[str, int, int]] = []
    last = 0
    for m in pattern.finditer(text):
        chunk = text[last : m.start()]
        if chunk.strip():
            parts.append((chunk, last, m.start()))
        last = m.end()
    if last < len(text):
        chunk = text[last:]
        if chunk.strip():
            parts.append((chunk, last, len(text)))
    return parts


def _extract_unique_sentences(text: str, count: int = 3) -> List[str]:
    """Pick 2–3 distinctive sentences for DDGS queries."""
    stop = frozenset(
        "the a an and or of to in for is are this that with as on by at from be was were it we our "
        "their has have had not but can will may also than such into which when where who how all "
        "been being these those its his her they them you your".split()
    )
    scored: List[Tuple[float, str]] = []
    for sent, _, _ in _split_sentences(text):
        s = sent.strip()
        if len(s) < 35 or len(s) > 400:
            continue
        words = {w.lower() for w in re.findall(r"[a-zA-Z]{3,}", s)}
        richness = len(words - stop)
        if richness < 4:
            continue
        scored.append((richness + len(s) * 0.02, s))
    scored.sort(key=lambda x: -x[0])
    out = [s for _, s in scored[:count]]
    if len(out) < count and text:
        for sent, _, _ in _split_sentences(text):
            s = sent.strip()
            if len(s) >= 25 and s not in out:
                out.append(s)
            if len(out) >= count:
                break
    return out[:count]


def _text_similarity(a: str, b: str) -> float:
    a = (a or "").lower().strip()
    b = (b or "").lower().strip()
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()


def _doc_overlap_percent(original: str, source: str) -> float:
    """Document-level similarity for ranking sources."""
    orig = _truncate(original, 8000)
    src = _truncate(source, 8000)
    if not orig or not src:
        return 0.0
    return round(_text_similarity(orig, src) * 100.0, 1)


def _strip_html_fallback(raw: bytes) -> str:
    try:
        text = raw.decode("utf-8", errors="ignore")
        text = re.sub(r"(?is)<script[^>]*>.*?</script>", " ", text)
        text = re.sub(r"(?is)<style[^>]*>.*?</style>", " ", text)
        text = re.sub(r"<[^>]+>", " ", text)
        return re.sub(r"\s+", " ", text).strip()[:MAX_SOURCE_TEXT]
    except Exception:
        return ""


def _fetch_url_text(url: str, fallback_snippet: str = "") -> str:
    url = (url or "").strip()
    if not url.startswith("http"):
        return fallback_snippet
    raw = _fetch_bytes(url)
    if not raw:
        return fallback_snippet
    if raw[:5] == b"%PDF-":
        try:
            import fitz

            doc = fitz.open(stream=raw, filetype="pdf")
            parts = [page.get_text("text") or "" for page in doc]
            doc.close()
            text = "\n".join(p.strip() for p in parts if p).strip()[:MAX_SOURCE_TEXT]
            return text or fallback_snippet
        except Exception:
            return fallback_snippet
    text = _extract_html_text(url, raw)
    if not text or len(text) < 60:
        text = _strip_html_fallback(raw)
    return (text or fallback_snippet)[:MAX_SOURCE_TEXT]


def _find_database_sources(title: str, description: str, user_text: str) -> List[PlagiarismSource]:
    docs, texts = find_similar_bahirdar_documents(title, description, user_text, limit=DB_LIMIT)
    sources: List[PlagiarismSource] = []
    for doc in docs[:DB_LIMIT]:
        body = texts.get(doc.id, doc.snippet or "")
        pct = doc.similarity_percent if doc.similarity_percent is not None else _doc_overlap_percent(user_text, body)
        sources.append(
            PlagiarismSource(
                id=doc.id,
                type="database",
                title=doc.title,
                link=doc.url if not doc.url.startswith("bahirdar://") else "",
                text=body,
                similarity_percent=pct,
            )
        )
    return sources


def _find_online_sources(user_text: str, title: str = "") -> List[PlagiarismSource]:
    queries = _extract_unique_sentences(user_text, 3)
    if not queries:
        queries = [_truncate(user_text, 180) or _truncate(title, 120) or "research paper"]

    seen_urls: set[str] = set()
    candidates: List[Tuple[str, str, str]] = []

    for q in queries:
        for hit in web_search(_truncate(q, 200), max_results=6):
            href = (hit.get("href") or "").strip()
            if not href.startswith("http") or href in seen_urls:
                continue
            seen_urls.add(href)
            hit_title = (hit.get("title") or href).strip()
            snippet = (hit.get("body") or "").strip()
            candidates.append((href, hit_title, snippet))
            if len(candidates) >= MAX_WEB_CANDIDATES:
                break
        if len(candidates) >= MAX_WEB_CANDIDATES:
            break

    if not candidates:
        for hit in web_search(_truncate(title or user_text, 160), max_results=6):
            href = (hit.get("href") or "").strip()
            if not href.startswith("http") or href in seen_urls:
                continue
            seen_urls.add(href)
            candidates.append((href, hit.get("title") or href, hit.get("body") or ""))
            if len(candidates) >= MAX_WEB_CANDIDATES:
                break

    ranked: List[Tuple[float, str, str, str]] = []
    for href, hit_title, snippet in candidates:
        preview = snippet or hit_title
        pct = _doc_overlap_percent(user_text, preview) if preview else 0.0
        ranked.append((pct, href, hit_title, preview))

    ranked.sort(key=lambda x: (-x[0], x[2]))
    sources: List[PlagiarismSource] = []
    seen_links: set[str] = set()

    for idx, (pct, href, hit_title, preview) in enumerate(ranked):
        if len(sources) >= WEB_LIMIT:
            break
        if href in seen_links:
            continue
        seen_links.add(href)

        body = preview
        if idx < MAX_URL_SCRAPES:
            scraped = _fetch_url_text(href, fallback_snippet=preview)
            if scraped and len(scraped) > len(preview):
                body = scraped[:WEB_SCRAPE_CHARS]
                pct = _doc_overlap_percent(user_text, body)

        if not body.strip():
            body = hit_title

        sources.append(
            PlagiarismSource(
                id=f"web-{len(sources)}-{uuid.uuid4().hex[:8]}",
                type="online",
                title=hit_title[:200],
                link=href,
                text=body,
                similarity_percent=pct,
            )
        )

    for pct, href, hit_title, preview in ranked:
        if len(sources) >= WEB_LIMIT:
            break
        if href in seen_links:
            continue
        seen_links.add(href)
        sources.append(
            PlagiarismSource(
                id=f"web-{len(sources)}-{uuid.uuid4().hex[:8]}",
                type="online",
                title=hit_title[:200],
                link=href,
                text=preview or hit_title,
                similarity_percent=pct,
            )
        )

    return sources[:WEB_LIMIT]


def _paper_body(paper: dict) -> str:
    abstract = str(paper.get("abstract") or "").strip()
    if abstract:
        return abstract
    tldr = paper.get("tldr")
    if isinstance(tldr, dict):
        return str(tldr.get("text") or "").strip()
    return ""


def _paper_compare_text(paper: dict) -> str:
    body = _paper_body(paper)
    if len(body) >= 24:
        return body
    title = str(paper.get("title") or "").strip()
    venue = str(paper.get("venue") or "").strip()
    return f"{title}. {venue}".strip() or title


def _find_publication_sources(title: str, description: str, user_text: str) -> List[PlagiarismSource]:
    collected: List[dict] = []
    seen_pids: set[str] = set()

    for q in _search_query_variants(title, description, user_text):
        payload = _s2_get(
            S2_PAPER_SEARCH,
            {"query": _truncate(q, 300), "limit": 10, "fields": S2_PAPER_FIELDS},
        )
        if not isinstance(payload, dict):
            continue
        papers = payload.get("data")
        if not isinstance(papers, list):
            continue
        for paper in papers:
            if not isinstance(paper, dict):
                continue
            pid = str(paper.get("paperId") or "")
            if pid and pid in seen_pids:
                continue
            if pid:
                seen_pids.add(pid)
            collected.append(paper)
            if len(collected) >= PUB_LIMIT * 3:
                break
        if collected:
            break

    if not collected:
        for doc in _semantic_scholar_search(_build_search_query(title, description, user_text), limit=PUB_LIMIT * 2):
            fake = {
                "paperId": doc.paper_id,
                "title": doc.title,
                "abstract": doc.snippet,
                "url": doc.url,
                "openAccessPdf": {"url": doc.url} if doc.document_type == "pdf" else {},
                "year": doc.year,
                "venue": doc.venue,
            }
            pid = doc.paper_id or doc.id
            if pid not in seen_pids:
                seen_pids.add(pid)
                collected.append(fake)

    ranked: List[Tuple[float, dict, str]] = []
    for paper in collected:
        body = _paper_compare_text(paper)
        if not body:
            continue
        pct = _doc_overlap_percent(user_text, body)
        ranked.append((pct, paper, body))

    ranked.sort(key=lambda x: (-x[0], str(x[1].get("title") or "")))
    sources: List[PlagiarismSource] = []
    used_ids: set[str] = set()

    for pct, paper, body in ranked:
        if len(sources) >= PUB_LIMIT:
            break
        doc = _paper_to_similar_document(paper, source="semantic_scholar", fallback_index=len(sources))
        if not doc or doc.id in used_ids:
            continue
        used_ids.add(doc.id)
        sources.append(
            PlagiarismSource(
                id=doc.id,
                type="publication",
                title=doc.title,
                link=doc.url or doc.s2_url or "",
                text=body,
                similarity_percent=max(pct, doc.similarity_percent or 0.0),
            )
        )

    for paper in collected:
        if len(sources) >= PUB_LIMIT:
            break
        doc = _paper_to_similar_document(paper, source="semantic_scholar", fallback_index=len(sources))
        if not doc or doc.id in used_ids:
            continue
        used_ids.add(doc.id)
        body = _paper_compare_text(paper)
        sources.append(
            PlagiarismSource(
                id=doc.id,
                type="publication",
                title=doc.title,
                link=doc.url or doc.s2_url or "",
                text=body or doc.title,
                similarity_percent=_doc_overlap_percent(user_text, body or doc.title),
            )
        )

    return sources[:PUB_LIMIT]


def _best_fuzzy_match(sentence: str, source: PlagiarismSource) -> Optional[Tuple[float, str]]:
    sent = sentence.strip()
    if len(sent) < 8:
        return None

    sent_norm = _normalize_compare(sent)
    src_norm = _normalize_compare(source.text)

    # Exact / near-exact sentence in corpus (critical for database uploads)
    if len(sent_norm) >= 20 and sent_norm in src_norm:
        return 1.0, sent[:320]

    best_ratio = 0.0
    best_excerpt = ""

    for src_sent, _, _ in _split_sentences(source.text):
        ss = src_sent.strip()
        if len(ss) < 8:
            continue
        ratio = _text_similarity(sent, ss)
        if ratio > best_ratio:
            best_ratio = ratio
            best_excerpt = ss[:320]

    if best_ratio < FUZZY_THRESHOLD and len(source.text) > 80:
        src_lower = source.text.lower()
        sent_lower = sent.lower()
        if sent_lower in src_lower:
            best_ratio = 1.0
            best_excerpt = sent[:320]
        else:
            window = min(len(sent) + 40, 500)
            for i in range(0, max(1, len(source.text) - window), max(1, window // 2)):
                chunk = source.text[i : i + window]
                ratio = _text_similarity(sent, chunk)
                if ratio > best_ratio:
                    best_ratio = ratio
                    best_excerpt = chunk[:320]

    threshold = 0.52 if source.type == "database" else FUZZY_THRESHOLD
    if best_ratio >= threshold:
        return best_ratio, best_excerpt
    return None


def _highlight_against_source(
    sentence: str, source: PlagiarismSource
) -> Optional[Tuple[float, str]]:
    """Fast path for database corpus (exact copy detection)."""
    sent = sentence.strip()
    if len(sent) < 8:
        return None

    sent_norm = _normalize_compare(sent)
    if source.type == "database" and source.similarity_percent >= 75.0:
        src_norm = _normalize_compare(source.text)
        if len(sent_norm) >= 15 and sent_norm in src_norm:
            return 1.0, sent[:320]

    return _best_fuzzy_match(sentence, source)


def _build_highlights(
    original: str, sources: List[PlagiarismSource]
) -> Tuple[List[HighlightSegment], List[DocumentMatch], float]:
    sentences = _split_sentences(original)
    if len(sentences) > 120:
        step = max(1, len(sentences) // 100)
        sentences = [sentences[i] for i in range(0, len(sentences), step)][:100]

    match_by_range: dict[Tuple[int, int], HighlightSegment] = {}

    for sent, start, end in sentences:
        if len(sent.strip()) < 8:
            continue
        best: Optional[Tuple[float, PlagiarismSource, str]] = None
        for src in sources:
            hit = _highlight_against_source(sent, src)
            if not hit:
                continue
            ratio, excerpt = hit
            if best is None or ratio > best[0]:
                best = (ratio, src, excerpt)
        if not best:
            continue
        ratio, src, excerpt = best
        key = (start, end)
        seg = HighlightSegment(
            segment=sent,
            is_plagiarized=True,
            start_index=start,
            end_index=end,
            source_id=src.id,
            source_title=src.title,
            source_type=src.type,
            similarity=round(ratio * 100.0, 1),
            color=SOURCE_COLORS[src.type],
        )
        if key not in match_by_range or seg.similarity > match_by_range[key].similarity:
            match_by_range[key] = seg

    plagiarized_chars = sum(len(s.segment) for s in match_by_range.values())
    total = max(len(original), 1)
    total_pct = round((plagiarized_chars / total) * 100.0, 1)

    doc_matches: List[DocumentMatch] = []
    for seg in sorted(match_by_range.values(), key=lambda s: s.start_index):
        src = next((s for s in sources if s.id == seg.source_id), None)
        doc_matches.append(
            DocumentMatch(
                user_start=seg.start_index,
                user_end=seg.end_index,
                matched_text=seg.segment[:400],
                source_document_id=seg.source_id,
                source_url=src.link if src else "",
                source_title=seg.source_title,
                similarity=seg.similarity,
                source_excerpt="",
                source_type=seg.source_type,
            )
        )

    if not match_by_range:
        return (
            [HighlightSegment(segment=original, is_plagiarized=False, start_index=0, end_index=len(original))],
            [],
            0.0,
        )

    segments: List[HighlightSegment] = []
    pos = 0
    for seg in sorted(match_by_range.values(), key=lambda s: s.start_index):
        if seg.start_index > pos:
            plain = original[pos:seg.start_index]
            segments.append(
                HighlightSegment(
                    segment=plain,
                    is_plagiarized=False,
                    start_index=pos,
                    end_index=seg.start_index,
                )
            )
        segments.append(seg)
        pos = seg.end_index
    if pos < len(original):
        segments.append(
            HighlightSegment(
                segment=original[pos:],
                is_plagiarized=False,
                start_index=pos,
                end_index=len(original),
            )
        )
    return segments, doc_matches, total_pct


def _source_to_similar_document(src: PlagiarismSource) -> SimilarDocument:
    source_map = {
        "database": "bahirdar_documents",
        "online": "duckduckgo_web",
        "publication": "semantic_scholar",
    }
    doc_type = {"database": "corpus", "online": "web", "publication": "semantic_scholar"}[src.type]
    return SimilarDocument(
        id=src.id,
        title=src.title,
        url=src.link or f"internal://{src.id}",
        snippet=f"{src.similarity_percent:.1f}% document overlap",
        document_type=doc_type,
        source=source_map[src.type],
        similarity_percent=src.similarity_percent,
    )


def _normalize_compare(text: str) -> str:
    text = (text or "").lower()
    text = re.sub(r"[^\w\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def run_plagiarism_check_db_only(title: str, description: str, file_content: str) -> PlagiarismEngineResult:
    """Fast path: Bahir Dar corpus only (used when full check times out)."""
    raw = strip_extraction_banner((file_content or "").strip())
    if raw.startswith("(No document body"):
        raw = f"{title}\n{description}".strip()

    db_sources = _find_database_sources(title, description, raw)
    segments, doc_matches, total_pct = _build_highlights(raw, db_sources)

    summary = PlagiarismSummary(
        db_matches=len(db_sources),
        web_matches=0,
        pub_matches=0,
        total_plagiarism_percent=total_pct,
    )
    note = (
        f"Database-only check: {len(db_sources)} corpus match(es), {total_pct}% flagged text."
        if db_sources
        else "No matches in bahirdar_documents corpus."
    )
    return PlagiarismEngineResult(
        summary=summary,
        highlighted_segments=segments,
        sources_list=db_sources,
        similar_documents=[_source_to_similar_document(s) for s in db_sources],
        document_matches=doc_matches,
        analysis_note=note,
    )


def run_plagiarism_check(title: str, description: str, file_content: str) -> PlagiarismEngineResult:
    raw = strip_extraction_banner((file_content or "").strip())
    if raw.startswith("(No document body"):
        raw = ""
    if len(raw) < 40 and (description or title):
        raw = f"{title}\n{description}\n{raw}".strip()

    # Database first — fast and must not be lost if web/pub time out
    db_sources = _find_database_sources(title, description, raw)
    web_sources: List[PlagiarismSource] = []
    pub_sources: List[PlagiarismSource] = []

    if len(raw) >= 30:
        with ThreadPoolExecutor(max_workers=2) as pool:
            f_web = pool.submit(_find_online_sources, raw, title)
            f_pub = pool.submit(_find_publication_sources, title, description, raw)
            try:
                web_sources = f_web.result(timeout=40) or []
            except Exception as e:
                print(f"plagiarism_engine: online sources failed: {e}")
            try:
                pub_sources = f_pub.result(timeout=40) or []
            except Exception as e:
                print(f"plagiarism_engine: publication sources failed: {e}")

    all_sources = db_sources + web_sources + pub_sources
    segments, doc_matches, total_pct = _build_highlights(raw, all_sources)

    summary = PlagiarismSummary(
        db_matches=len(db_sources),
        web_matches=len(web_sources),
        pub_matches=len(pub_sources),
        total_plagiarism_percent=total_pct,
    )

    note_parts: List[str] = []
    if db_sources:
        note_parts.append(f"{len(db_sources)} database match(es)")
    if web_sources:
        note_parts.append(f"{len(web_sources)} online match(es) via DuckDuckGo")
    if pub_sources:
        note_parts.append(f"{len(pub_sources)} publication match(es) via Semantic Scholar")
    analysis_note = (
        "Plagiarism check: " + ", ".join(note_parts) + f". Total flagged text: {total_pct}%."
        if note_parts
        else "No sources matched — try a longer document."
    )

    return PlagiarismEngineResult(
        summary=summary,
        highlighted_segments=segments,
        sources_list=all_sources,
        similar_documents=[_source_to_similar_document(s) for s in all_sources],
        document_matches=doc_matches,
        analysis_note=analysis_note,
    )


def to_document_similarity_result(engine: PlagiarismEngineResult) -> DocumentSimilarityResult:
    return DocumentSimilarityResult(
        similar_documents=engine.similar_documents,
        document_matches=engine.document_matches,
        analysis_note=engine.analysis_note,
        plagiarism_summary={
            "db_matches": engine.summary.db_matches,
            "web_matches": engine.summary.web_matches,
            "pub_matches": engine.summary.pub_matches,
            "total_plagiarism_percent": engine.summary.total_plagiarism_percent,
        },
        highlighted_segments=[
            {
                "segment": s.segment,
                "is_plagiarized": s.is_plagiarized,
                "start_index": s.start_index,
                "end_index": s.end_index,
                "source_id": s.source_id,
                "source_title": s.source_title,
                "source_type": s.source_type,
                "similarity": s.similarity,
                "color": s.color,
            }
            for s in engine.highlighted_segments
        ],
        sources_list=[
            {
                "type": s.type,
                "id": s.id,
                "title": s.title,
                "link": s.link,
                "similarity_percent": s.similarity_percent,
            }
            for s in engine.sources_list
        ],
    )
