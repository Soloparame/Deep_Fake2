"""Extract plain text from PDF (PyMuPDF) and DOCX (python-docx)."""

from __future__ import annotations

import io
import os
import re
from typing import List, Tuple

_EXTRACTION_BANNER_RE = re.compile(
    r"^\[Extracted \d+ of \d+ pages[^\]]*\]\s*\n+",
    re.IGNORECASE | re.MULTILINE,
)
_MARKET_DOC_SPLIT = "--- document ---"
_STOPWORDS = frozenset(
    "the a an and or of to in for is are this that with as on by at from be was were it we our "
    "their has have had not but can will may also than such into which when where who how all "
    "been being these those its his her they them you your".split()
)

# Limits for very large uploads (e.g. 100+ page PDFs)
MAX_DOCUMENT_BODY_CHARS = 50_000
MAX_PDF_PAGES_EXTRACT = 48
MAX_PDF_CHARS_EXTRACT = 120_000


def _pdf_page_indices(page_count: int) -> List[int]:
    """Sample pages across the document instead of extracting all 100+ pages."""
    if page_count <= MAX_PDF_PAGES_EXTRACT:
        return list(range(page_count))

    indices: set[int] = set()
    # First ~18 pages
    for i in range(min(18, page_count)):
        indices.add(i)
    # Last ~12 pages
    for i in range(max(0, page_count - 12), page_count):
        indices.add(i)
    # Evenly spaced through the middle
    remaining = MAX_PDF_PAGES_EXTRACT - len(indices)
    if remaining > 0:
        step = max(1, page_count // remaining)
        for i in range(0, page_count, step):
            indices.add(i)
            if len(indices) >= MAX_PDF_PAGES_EXTRACT:
                break
    return sorted(indices)


def extract_text_from_pdf(data: bytes) -> str:
    import fitz  # PyMuPDF

    doc = fitz.open(stream=data, filetype="pdf")
    page_count = len(doc)
    indices = _pdf_page_indices(page_count)
    parts: list[str] = []
    total_chars = 0
    sampled = page_count > len(indices)

    for i in indices:
        parts.append(doc[i].get_text("text") or "")
        total_chars += len(parts[-1])
        if total_chars >= MAX_PDF_CHARS_EXTRACT:
            break

    doc.close()
    text = "\n".join(p.strip() for p in parts if p).strip()
    if sampled and text:
        text = (
            f"[Extracted {len(indices)} of {page_count} pages for analysis speed. "
            f"Download your original file for the complete document.]\n\n{text}"
        )
    if len(text) > MAX_PDF_CHARS_EXTRACT:
        text = text[: MAX_PDF_CHARS_EXTRACT - 3] + "..."
    return text


def extract_text_from_docx(data: bytes) -> str:
    from docx import Document

    doc = Document(io.BytesIO(data))
    paragraphs = [p.text for p in doc.paragraphs if p.text]
    text = "\n".join(paragraphs).strip()
    if len(text) > MAX_PDF_CHARS_EXTRACT:
        return text[: MAX_PDF_CHARS_EXTRACT - 3] + "..."
    return text


def extract_text_from_upload(filename: str, data: bytes) -> Tuple[str, str]:
    """
    Returns (extracted_text, kind) where kind is 'pdf' | 'docx' | 'empty'.
    Raises ValueError for unsupported extensions.
    """
    ext = os.path.splitext((filename or "").lower())[1]
    if ext == ".pdf":
        return extract_text_from_pdf(data), "pdf"
    if ext in (".docx",):
        return extract_text_from_docx(data), "docx"
    if ext == ".doc":
        raise ValueError(
            "Legacy .doc is not supported. Please save as .docx or export to PDF."
        )
    raise ValueError(f"Unsupported document type: {ext or '(none)'}")


def extract_document_body(extracted: str, pasted: str = "", description: str = "") -> str:
    """
    Primary text for plagiarism/highlight analysis: uploaded or pasted document only.
    Title/description are metadata and must not replace the document body.
    """
    body = (extracted or pasted or "").strip()
    if not body:
        body = (description or "").strip()
    if len(body) > MAX_DOCUMENT_BODY_CHARS:
        return body[: MAX_DOCUMENT_BODY_CHARS - 3] + "..."
    return body


def merge_content_snippet(title: str, description: str, extracted: str, max_chars: int = 12000) -> str:
    """Merged context for market similarity (includes metadata + body)."""
    body = (extracted or "").strip()
    if body:
        base = f"{title}\n\n{description}\n\n{_MARKET_DOC_SPLIT}\n\n{body}".strip()
    else:
        base = f"{title}\n\n{description}".strip()
    if len(base) <= max_chars:
        return base
    return base[: max_chars - 3] + "..."


def strip_extraction_banner(text: str) -> str:
    """Remove PDF sampling notice so search/matching use real content."""
    if not text:
        return ""
    return _EXTRACTION_BANNER_RE.sub("", text).strip()


def split_market_context(merged: str) -> tuple[str, str]:
    """Split merge_content_snippet output into (metadata, document body)."""
    raw = (merged or "").strip()
    if _MARKET_DOC_SPLIT in raw:
        meta, body = raw.split(_MARKET_DOC_SPLIT, 1)
        return meta.strip(), strip_extraction_banner(body.strip())
    return raw, ""


def document_excerpt_for_search(text: str, max_chars: int = 2500) -> str:
    """
    Clean excerpt for competitor / paper search (intro + early body, no banners).
    """
    _, body = split_market_context(text)
    content = body or strip_extraction_banner(text)
    content = re.sub(r"\s+", " ", content).strip()
    if not content:
        return ""
    if len(content) <= max_chars:
        return content
    # Favor start of doc (abstract, intro) where topic keywords live
    return content[: max_chars - 3] + "..."


def search_keywords_from_text(text: str, max_words: int = 28) -> str:
    """Short keyword line for Semantic Scholar / web PDF queries."""
    content = strip_extraction_banner(text)
    _, body = split_market_context(content)
    content = body or content
    lines = [
        ln.strip()
        for ln in content.splitlines()
        if ln.strip() and not ln.startswith("[") and not ln.startswith("ℹ️")
    ]
    flat = " ".join(lines[:12])
    words = re.sub(r"[^\w\s]", " ", flat).split()
    meaningful = [w for w in words if len(w) > 2 and w.lower() not in _STOPWORDS]
    return " ".join(meaningful[:max_words])
