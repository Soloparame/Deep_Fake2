"""Extract plain text from PDF (PyMuPDF) and DOCX (python-docx)."""

from __future__ import annotations

import io
import os
from typing import Tuple


def extract_text_from_pdf(data: bytes) -> str:
    import fitz  # PyMuPDF

    doc = fitz.open(stream=data, filetype="pdf")
    parts: list[str] = []
    for page in doc:
        parts.append(page.get_text("text") or "")
    doc.close()
    return "\n".join(p.strip() for p in parts if p).strip()


def extract_text_from_docx(data: bytes) -> str:
    from docx import Document

    doc = Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs if p.text).strip()


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


def merge_content_snippet(title: str, description: str, extracted: str, max_chars: int = 12000) -> str:
    base = f"{title}\n\n{description}\n\n{extracted}".strip()
    if len(base) <= max_chars:
        return base
    return base[: max_chars - 3] + "..."
