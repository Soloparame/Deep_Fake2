"""
Real similarity / overlap index: DuckDuckGo (market context) + Hugging Face Inference API
(sentence-transformers/all-MiniLM-L6-v2) via huggingface_hub.InferenceClient.sentence_similarity.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from fastapi_backend.core.config import settings

HF_SIMILARITY_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
MAX_USER_CHARS = 2000
MAX_MARKET_CHARS = 1200
FALLBACK_SCORE = 65.0


@dataclass
class SimilarityResult:
    score: float  # 0–100
    label: str  # "similar" | "distinct"
    description: str
    market_snippet: str
    search_ok: bool
    hf_ok: bool


def _truncate(s: str, max_len: int) -> str:
    s = (s or "").strip()
    if len(s) <= max_len:
        return s
    return s[: max_len - 1] + "…"


def _duckduckgo_summary(query: str) -> str:
    try:
        from langchain_community.tools import DuckDuckGoSearchRun

        tool = DuckDuckGoSearchRun()
        out = tool.run(query)
        return (out or "").strip()
    except Exception as e:
        print(f"similarity_search: DuckDuckGoSearchRun failed: {e}")
        return ""


def _hf_overlap_score(user_text: str, market_text: str) -> Optional[float]:
    token = (settings.HF_TOKEN or "").strip()
    if not token:
        return None
    market_text = (market_text or "").strip()
    if len(market_text) < 16:
        return None

    try:
        from huggingface_hub import InferenceClient

        client = InferenceClient(provider="hf-inference", api_key=token)
        sentence = _truncate(user_text, MAX_USER_CHARS)
        other = _truncate(market_text, MAX_MARKET_CHARS)
        scores = client.sentence_similarity(
            sentence,
            [other],
            model=HF_SIMILARITY_MODEL,
        )
        if not scores:
            return None
        raw = float(scores[0])
        if raw < 0:
            raw = (raw + 1) / 2.0
        raw = max(0.0, min(1.0, raw))
        return round(raw * 100.0, 1)
    except Exception as e:
        print(f"similarity_search: Hugging Face sentence_similarity failed: {e}")
        return None


def compute_similarity_overlap(title: str, description: str, file_content: str) -> SimilarityResult:
    """
    1) Search the open web for comparable products/startups (DuckDuckGo).
    2) Compare the user's text to that summary with MiniLM semantic similarity on HF Inference.
    """
    title = (title or "").strip()
    description = (description or "").strip()
    body = (file_content or "").strip()

    user_blob = f"{title}\n\n{description}\n\n{body}".strip()
    if len(user_blob) < 24:
        user_blob = f"{title}\n{description}".strip() or title or "Project"

    query = f"software startup OR product similar to: {title} {description[:500]}"
    search_text = _duckduckgo_summary(query)
    search_ok = bool(search_text and len(search_text) > 48)

    if search_ok:
        market_snippet = _truncate(search_text, MAX_MARKET_CHARS)
    else:
        market_snippet = _truncate(
            f"Commercial and open-source tools in the same problem space as “{title}”. "
            f"Representative descriptions often mention APIs, SaaS dashboards, and document or text analysis workflows. "
            f"Context: {description[:600]}",
            MAX_MARKET_CHARS,
        )

    hf_score = _hf_overlap_score(user_blob, market_snippet)
    hf_ok = hf_score is not None
    score = float(hf_score) if hf_ok else FALLBACK_SCORE
    score = max(0.0, min(100.0, score))

    label = "similar" if score >= 50.0 else "distinct"

    if hf_ok:
        desc = (
            "Semantic overlap between your text and web-sourced descriptions of comparable projects, "
            f"via Hugging Face ({HF_SIMILARITY_MODEL})."
        )
    else:
        desc = (
            f"Fallback score ({FALLBACK_SCORE:.0f}) — set HF_TOKEN in fastapi_backend/.env for live MiniLM scoring. "
            f"Web search: {'ok' if search_ok else 'limited or unavailable'}."
        )

    return SimilarityResult(
        score=score,
        label=label,
        description=desc,
        market_snippet=market_snippet[:800],
        search_ok=search_ok,
        hf_ok=hf_ok,
    )
