"""
Real similarity / overlap index: DuckDuckGo (market context) + Hugging Face Inference API
(sentence-transformers/all-MiniLM-L6-v2) via huggingface_hub.InferenceClient.sentence_similarity.
"""

from __future__ import annotations

from dataclasses import dataclass
import json
import re
from typing import Any, Optional

from fastapi_backend.core.config import settings

HF_SIMILARITY_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
MAX_USER_CHARS = 2000
MAX_MARKET_CHARS = 800
FALLBACK_SCORE = 65.0


@dataclass
class SimilarProject:
    name: str
    link: str
    snippet: str


@dataclass
class SimilarityResult:
    score: float  # 0–100
    label: str  # "similar" | "distinct"
    description: str
    market_snippet: str
    search_ok: bool
    hf_ok: bool
    found_projects: list[SimilarProject]


@dataclass
class SmartContext:
    functionality: str
    location: str
    industry: str
    search_query: str


def _truncate(s: str, max_len: int) -> str:
    s = (s or "").strip()
    if len(s) <= max_len:
        return s
    return s[: max_len - 1] + "…"


def _clean_text(text: str) -> str:
    """Normalize text so tiny formatting differences do not jitter the score."""
    text = (text or "").lower()
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^\w\s]", "", text)
    return text.strip()


def _duckduckgo_summary(query: str) -> str:
    """Web search for competitor context. Tries duckduckgo-search first (works better on servers)."""
    q = (query or "").strip()
    if not q:
        return ""

    # Primary: duckduckgo-search (more reliable on Render/datacenter IPs than langchain wrapper)
    try:
        from duckduckgo_search import DDGS

        with DDGS() as ddgs:
            results = list(ddgs.text(q, max_results=6))
        if results:
            parts = []
            for r in results:
                title = (r.get("title") or "").strip()
                body = (r.get("body") or "").strip()
                href = (r.get("href") or "").strip()
                if title or body:
                    line = title
                    if body:
                        line = f"{line}: {body}" if line else body
                    if href:
                        line = f"{line} {href}".strip()
                    parts.append(line)
            if parts:
                return "\n".join(parts)
    except Exception as e:
        print(f"similarity_search: duckduckgo_search.DDGS failed: {e}")

    try:
        from langchain_community.tools import DuckDuckGoSearchRun

        tool = DuckDuckGoSearchRun()
        out = tool.run(q)
        return (out or "").strip()
    except Exception as e:
        print(f"similarity_search: DuckDuckGoSearchRun failed: {e}")
        return ""


def _get_smart_context(title: str, description: str) -> SmartContext:
    fallback = SmartContext(
        functionality=_truncate(title or "software tool", 64),
        location="Global",
        industry="software",
        search_query=f'"{title}" software startup alternative description',
    )
    api_key = (getattr(settings, "GROQ_API_KEY", "") or "").strip()
    if not api_key:
        return fallback
    try:
        from groq import Groq

        client = Groq(api_key=api_key)
        prompt = f"""
Analyze this project and extract concise context for competitor search.

Title: {title}
Description: {description[:1200]}

Return JSON only:
{{
  "functionality": "3 words max",
  "location": "country/region or Global",
  "industry": "industry name",
  "search_query": "precise competitor search query"
}}
""".strip()
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "Return only valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        raw = completion.choices[0].message.content or "{}"
        data = json.loads(raw)
        if not isinstance(data, dict):
            return fallback
        functionality = _truncate(str(data.get("functionality", "")).strip() or fallback.functionality, 64)
        location = _truncate(str(data.get("location", "")).strip() or "Global", 48)
        industry = _truncate(str(data.get("industry", "")).strip() or fallback.industry, 64)
        search_query = _truncate(
            str(data.get("search_query", "")).strip()
            or f"{functionality} {industry} in {location} competitors",
            220,
        )
        return SmartContext(
            functionality=functionality,
            location=location,
            industry=industry,
            search_query=search_query,
        )
    except Exception as e:
        print(f"similarity_search: smart context via Groq failed: {e}")
        return fallback


def _duckduckgo_smart_search(ctx: SmartContext) -> str:
    query = _truncate(
        ctx.search_query
        or f'{ctx.functionality} {ctx.industry} in {ctx.location} competitors',
        220,
    )
    return _duckduckgo_summary(query)


def _hf_smart_overlap_score(user_text: str, market_text: str, ctx: SmartContext) -> Optional[float]:
    token = (settings.HF_TOKEN or "").strip()
    if not token:
        return None
    market_text = (market_text or "").strip()
    if len(market_text) < 16:
        return None

    try:
        from huggingface_hub import InferenceClient

        client = InferenceClient(provider="hf-inference", api_key=token)
        sentence = _clean_text(_truncate(user_text, MAX_USER_CHARS))
        other = _clean_text(_truncate(market_text, MAX_MARKET_CHARS))
        if len(sentence) < 8 or len(other) < 8:
            return None
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

        # Smart boosts: same location / functionality presence in market snippet.
        other_l = other.lower()
        loc = (ctx.location or "").strip().lower()
        func = (ctx.functionality or "").strip().lower()
        if loc and loc != "global" and loc in other_l:
            raw += 0.15
        if func and func in other_l:
            raw += 0.10
        raw = max(0.0, min(1.0, raw))

        # Stable UX bucket: 0,5,10,...100 to reduce live-search jitter.
        return float(round(raw * 20.0) * 5.0)
    except Exception as e:
        print(f"similarity_search: Hugging Face sentence_similarity failed: {e}")
        return None


def _project_rank_bonus(p: SimilarProject, ctx: SmartContext) -> int:
    text = f"{p.name} {p.snippet} {p.link}".lower()
    bonus = 0
    loc = (ctx.location or "").strip().lower()
    func = (ctx.functionality or "").strip().lower()
    ind = (ctx.industry or "").strip().lower()
    if loc and loc != "global" and loc in text:
        bonus += 2
    if func and func in text:
        bonus += 2
    if ind and ind in text:
        bonus += 1
    return bonus


def _rank_projects(projects: list[SimilarProject], ctx: SmartContext) -> list[SimilarProject]:
    return sorted(projects, key=lambda p: _project_rank_bonus(p, ctx), reverse=True)


def _extract_projects_fallback(search_text: str) -> list[SimilarProject]:
    lines = [ln.strip(" -•\t") for ln in (search_text or "").splitlines() if ln.strip()]
    projects: list[SimilarProject] = []
    seen_links: set[str] = set()
    url_re = re.compile(r"https?://[^\s)>\]]+")

    for ln in lines:
        urls = url_re.findall(ln)
        if not urls:
            continue
        link = urls[0].rstrip(".,;")
        if link in seen_links:
            continue
        seen_links.add(link)

        # Try to infer a readable name from the text before the URL or from the domain.
        before_url = ln.split(link, 1)[0].strip(" :-|")
        if before_url and len(before_url) >= 2:
            name = before_url[:80]
        else:
            host = link.replace("https://", "").replace("http://", "").split("/", 1)[0]
            name = host.replace("www.", "")

        snippet = ln[:220]
        projects.append(SimilarProject(name=name, link=link, snippet=snippet))
        if len(projects) >= 4:
            break
    return projects


def _groq_competitors_from_project(
    title: str, description: str, ctx: SmartContext
) -> list[SimilarProject]:
    """When web search is empty/blocked, ask Groq for real competitor names + links."""
    api_key = (getattr(settings, "GROQ_API_KEY", "") or "").strip()
    if not api_key:
        return []
    try:
        from groq import Groq

        client = Groq(api_key=api_key)
        prompt = f"""
List 3-4 real, existing software products or companies that compete with this project.
Use well-known products where possible and valid https:// official site URLs.

Title: {title}
Description: {(description or "")[:1500]}
Functionality: {ctx.functionality}
Industry: {ctx.industry}
Location/market: {ctx.location}

Return only JSON: {{"projects": [{{"name": "...", "link": "https://...", "snippet": "one sentence"}}]}}
""".strip()
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "Output only valid JSON with real competitor companies."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        raw = completion.choices[0].message.content or "{}"
        data = json.loads(raw)
        items = data.get("projects", []) if isinstance(data, dict) else []
        out: list[SimilarProject] = []
        for item in items:
            if not isinstance(item, dict):
                continue
            name = str(item.get("name", "")).strip()[:120]
            link = str(item.get("link", "")).strip()
            snippet = str(item.get("snippet", "")).strip()[:240]
            if name and link.startswith("http"):
                out.append(SimilarProject(name=name, link=link, snippet=snippet or name))
            if len(out) >= 4:
                break
        return out
    except Exception as e:
        print(f"similarity_search: Groq competitor fallback failed: {e}")
        return []


def _extract_project_list(search_text: str, ctx: SmartContext) -> list[SimilarProject]:
    api_key = (getattr(settings, "GROQ_API_KEY", "") or "").strip()
    if not api_key or not search_text.strip():
        return _rank_projects(_extract_projects_fallback(search_text), ctx)

    try:
        from groq import Groq

        client = Groq(api_key=api_key)
        prompt = f"""
Extract the top 3-4 real software projects/companies from this search text.
Prioritize entries matching this context:
- functionality: {ctx.functionality}
- location: {ctx.location}
- industry: {ctx.industry}

Return only JSON object with key "projects", where each item has:
- name (string)
- link (absolute URL string)
- snippet (very short one-sentence description)

SEARCH TEXT:
{search_text[:3000]}
""".strip()

        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "Extract entities and output only valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        raw = completion.choices[0].message.content or "{}"
        data = json.loads(raw)
        items = data.get("projects", []) if isinstance(data, dict) else []

        out: list[SimilarProject] = []
        for item in items:
            if not isinstance(item, dict):
                continue
            name = str(item.get("name", "")).strip()[:120]
            link = str(item.get("link", "")).strip()
            snippet = str(item.get("snippet", "")).strip()[:240]
            if not (name and link.startswith("http")):
                continue
            out.append(SimilarProject(name=name, link=link, snippet=snippet or name))
            if len(out) >= 4:
                break
        return _rank_projects(out or _extract_projects_fallback(search_text), ctx)
    except Exception as e:
        print(f"similarity_search: project extraction via Groq failed: {e}")
        return _rank_projects(_extract_projects_fallback(search_text), ctx)


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

    smart_ctx = _get_smart_context(title, description)
    search_text = _duckduckgo_smart_search(smart_ctx)
    search_ok = bool(search_text and len(search_text) > 48)
    found_projects = _extract_project_list(search_text, smart_ctx) if search_ok else []
    if not found_projects:
        found_projects = _groq_competitors_from_project(title, description, smart_ctx)
        if found_projects and not search_ok:
            search_ok = True
            search_text = (
                f"Competitor context for {smart_ctx.functionality} in {smart_ctx.industry} "
                f"({smart_ctx.location}), sourced via Groq when live web search was unavailable."
            )

    if search_ok:
        market_snippet = _truncate(search_text, MAX_MARKET_CHARS)
    else:
        market_snippet = _truncate(
            f"Commercial and open-source tools in the same problem space as “{title}”. "
            f"Representative descriptions often mention APIs, SaaS dashboards, and document or text analysis workflows. "
            f"Context: {description[:600]}",
            MAX_MARKET_CHARS,
        )

    hf_score = _hf_smart_overlap_score(user_blob, market_snippet, smart_ctx)
    hf_ok = hf_score is not None
    score = float(hf_score) if hf_ok else FALLBACK_SCORE
    score = max(0.0, min(100.0, score))

    label = "similar" if score >= 50.0 else "distinct"

    if hf_ok:
        desc = (
            "Smart overlap between your text and web-sourced competitors (semantic similarity + "
            f"context boosts for functionality/location), via Hugging Face ({HF_SIMILARITY_MODEL}). "
            f"Context: {smart_ctx.functionality} | {smart_ctx.location} | {smart_ctx.industry}."
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
        found_projects=found_projects,
    )
