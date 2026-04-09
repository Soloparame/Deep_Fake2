from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Tuple
from urllib.parse import quote_plus

import requests

from fastapi_backend.core.config import settings
from fastapi_backend.schemas.analysis import ReferenceItem, SWOTBlock


def _fallback_recommendations() -> List[str]:
    return [
        "Narrow your target audience to one niche to reduce direct overlap with broad incumbents.",
        "Instrument a measurable KPI dashboard (activation, retention, and report quality) before adding new features.",
        "Ship one defensible differentiator in the next sprint and validate it with a small beta cohort.",
        "Add citation-grade evidence in reports to improve trust and repeat usage.",
    ]


def _fallback_references() -> List[ReferenceItem]:
    return [
        ReferenceItem(
            title="Sentence-BERT: Sentence Embeddings (arXiv)",
            url="https://arxiv.org/abs/1908.10084",
            kind="arxiv",
        ),
        ReferenceItem(
            title="Plagiarism Detection Topics (GitHub)",
            url="https://github.com/topics/plagiarism-detection",
            kind="github",
        ),
        ReferenceItem(
            title="Dense Passage Retrieval for Open-Domain QA (arXiv)",
            url="https://arxiv.org/abs/2004.04906",
            kind="arxiv",
        ),
    ]


def _clean_recommendations(v: Any) -> List[str]:
    if not isinstance(v, list):
        return []
    out: List[str] = []
    for item in v:
        if isinstance(item, str):
            s = item.strip()
            if s:
                out.append(s[:220])
    return out[:4]


def _clean_topics(v: Any) -> List[str]:
    if not isinstance(v, list):
        return []
    topics: List[str] = []
    for item in v:
        if isinstance(item, str):
            s = re.sub(r"\s+", " ", item).strip()
            if s:
                topics.append(s[:60])
    return topics[:2]


def _parse_llm_json(raw: str) -> Tuple[List[str], List[str]]:
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError("recommendation response is not an object")
    recs = _clean_recommendations(data.get("recommendations"))
    topics = _clean_topics(data.get("topics"))
    return recs, topics


def _get_arxiv_link(topic: str) -> ReferenceItem | None:
    try:
        q = quote_plus(topic)
        url = (
            "http://export.arxiv.org/api/query?"
            f"search_query=all:{q}&start=0&max_results=1&sortBy=relevance&sortOrder=descending"
        )
        res = requests.get(url, timeout=12)
        if not res.ok:
            return None
        text = res.text
        m_id = re.search(r"<id>(https?://arxiv\.org/abs/[^<]+)</id>", text)
        m_title = re.search(r"<title>\s*([^<\n][^<]*)</title>", text)
        if not m_id:
            return None
        title = (m_title.group(1).strip() if m_title else topic) + " (arXiv)"
        return ReferenceItem(title=title[:120], url=m_id.group(1), kind="arxiv")
    except Exception:
        return None


def _github_topic_link(topic: str) -> ReferenceItem:
    slug = re.sub(r"[^a-z0-9]+", "-", topic.lower()).strip("-") or "machine-learning"
    return ReferenceItem(
        title=f"{topic} (GitHub topics)",
        url=f"https://github.com/topics/{slug}",
        kind="github",
    )


def _build_resources(topics: List[str], title: str) -> List[ReferenceItem]:
    refs: List[ReferenceItem] = []
    for topic in topics[:2]:
        arx = _get_arxiv_link(topic)
        if arx:
            refs.append(arx)
        refs.append(_github_topic_link(topic))
    if not refs:
        refs = _fallback_references()

    # Always keep at least one project-relevant GitHub topic
    project_slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    if project_slug:
        refs.append(
            ReferenceItem(
                title=f"{title[:60]} (GitHub topics)",
                url=f"https://github.com/topics/{project_slug}",
                kind="github",
            )
        )

    # Deduplicate by URL and keep first 4.
    seen = set()
    uniq: List[ReferenceItem] = []
    for r in refs:
        if r.url in seen:
            continue
        seen.add(r.url)
        uniq.append(r)
    return uniq[:4]


def generate_recommendations_and_resources(
    project_title: str,
    project_description: str,
    similarity_score: float,
    swot: SWOTBlock,
    market_snippet: str,
) -> Tuple[List[str], List[ReferenceItem]]:
    api_key = (getattr(settings, "GROQ_API_KEY", "") or "").strip()
    if not api_key:
        return _fallback_recommendations(), _fallback_references()

    try:
        from groq import Groq

        client = Groq(api_key=api_key)
        weak = "; ".join(swot.weaknesses[:3]) or "No explicit weaknesses provided."
        prompt = f"""
Project: {project_title}
Description: {project_description[:900]}
Similarity score: {round(similarity_score)}%
Weaknesses: {weak}
Market context: {market_snippet[:700]}

Return valid JSON object only:
{{
  "recommendations": ["4 concise actionable recommendations for the developer"],
  "topics": ["2 specific technical topics to research"]
}}
""".strip()

        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a product strategy advisor. Output only valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        raw = completion.choices[0].message.content or "{}"
        recs, topics = _parse_llm_json(raw)
        if not recs:
            recs = _fallback_recommendations()
        resources = _build_resources(topics, project_title)
        return recs, resources
    except Exception as e:
        print(f"recommendations_service: fallback ({e})")
        return _fallback_recommendations(), _fallback_references()

