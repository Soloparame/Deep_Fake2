from __future__ import annotations

import json
from typing import Any, Dict, List

from fastapi_backend.core.config import settings
from fastapi_backend.schemas.analysis import StrategyBlock, StrategyVenn


def _fallback_strategy() -> StrategyBlock:
    return StrategyBlock(
        venn=StrategyVenn(
            shared_features=[
                "Document upload & similarity score",
                "User dashboard for history",
                "API-first integration story",
            ],
            unique_to_you=[
                "Devil’s advocate defense prep",
                "Combined SWOT + tech lens in one report",
                "Strategy tab with pivot ideas tailored to your abstract",
            ],
            unique_to_market=[
                "Mature enterprise SSO & audit trails",
                "Large pre-indexed web corpus licensing",
            ],
        ),
        market_pivots=[
            "Position as thesis-defense copilot for graduate programs",
            "Sell to bootcamps as originality + structure coach",
            "White-label API for LMS vendors",
        ],
        monetization=[
            "SaaS: tiered monthly plans by pages analyzed",
            "Freemium: free limited scans; paid deep reports & exports",
            "B2B site license for institutions",
        ],
    )


def _clean_list(v: Any, max_items: int, max_len: int = 180) -> List[str]:
    if not isinstance(v, list):
        return []
    out: List[str] = []
    for item in v:
        if isinstance(item, str):
            s = item.strip()
            if s:
                out.append(s[:max_len])
    return out[:max_items]


def _clean_pivot_list(v: Any) -> List[str]:
    """
    Accept either:
    - ["pivot text", ...]
    - [{"title":"...", "description":"..."}, ...]
    and normalize to display strings.
    """
    out: List[str] = []
    if isinstance(v, list):
        for item in v:
            if isinstance(item, str):
                s = item.strip()
                if s:
                    out.append(s[:220])
            elif isinstance(item, dict):
                title = str(item.get("title", "")).strip()
                desc = str(item.get("description", "")).strip()
                if title and desc:
                    out.append(f"{title}: {desc}"[:220])
                elif title:
                    out.append(title[:220])
                elif desc:
                    out.append(desc[:220])
    return out[:3]


def _clean_monetization_list(v: Any) -> List[str]:
    """
    Accept either:
    - ["model text", ...]
    - [{"model":"SaaS", "details":"..."}, ...]
    and normalize to display strings.
    """
    out: List[str] = []
    if isinstance(v, list):
        for item in v:
            if isinstance(item, str):
                s = item.strip()
                if s:
                    out.append(s[:220])
            elif isinstance(item, dict):
                model = str(item.get("model", "")).strip()
                details = str(item.get("details", "")).strip()
                if model and details:
                    out.append(f"{model}: {details}"[:220])
                elif model:
                    out.append(model[:220])
                elif details:
                    out.append(details[:220])
    return out[:3]


def _parse_positioning_json(raw: str) -> Dict[str, List[str]]:
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError("Positioning response is not a JSON object")
    return {
        "shared": _clean_list(data.get("shared"), 4),
        "unique_to_you": _clean_list(data.get("unique_to_you"), 4),
        "unique_to_market": _clean_list(data.get("unique_to_market"), 4),
        "pivots": _clean_pivot_list(data.get("pivots") or data.get("market_pivots")),
        "monetization": _clean_monetization_list(data.get("monetization")),
    }


def generate_market_positioning(
    project_title: str,
    project_description: str,
    similarity_score: float,
    market_snippet: str,
    swot_weaknesses: List[str] | None = None,
    my_tech_stack: str = "",
) -> StrategyBlock:
    """
    Build the Strategy/Positioning section via Groq:
      - Shared scope (market + you)
      - Unique to you
      - Unique to market
      - Pivot ideas
    """
    api_key = (getattr(settings, "GROQ_API_KEY", "") or "").strip()
    if not api_key:
        return _fallback_strategy()

    weaknesses = ", ".join((swot_weaknesses or [])[:3]) or "No explicit weaknesses provided."

    try:
        from groq import Groq

        client = Groq(api_key=api_key)
        crowded = "crowded" if similarity_score >= 65 else "moderately crowded"
        prompt = f"""
Compare the project '{project_title}' against current market solutions.
Description: {project_description[:1000]}
Similarity score: {round(similarity_score)}%
Market snippet: {market_snippet[:700]}
Known weaknesses: {weaknesses}
Tech stack: {my_tech_stack or "Not specified"}
Market density signal: {crowded}

Return JSON object only:
{{
  "shared": ["features both project and market have"],
  "unique_to_you": ["your differentiators"],
  "unique_to_market": ["mature competitor features missing here"],
  "pivots": [
    {{"title": "Niche angle", "description": "How to pivot and why this reduces direct competition"}}
  ],
  "monetization": [
    {{"model": "SaaS", "details": "Tiered monthly plans"}},
    {{"model": "Freemium", "details": "Free vs paid boundaries"}},
    {{"model": "B2B", "details": "Institution/company sales motion"}}
  ]
}}
""".strip()

        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a market strategist. Output only valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )

        raw = completion.choices[0].message.content or "{}"
        parsed = _parse_positioning_json(raw)

        fb = _fallback_strategy()
        return StrategyBlock(
            venn=StrategyVenn(
                shared_features=parsed["shared"] or fb.venn.shared_features,
                unique_to_you=parsed["unique_to_you"] or fb.venn.unique_to_you,
                unique_to_market=parsed["unique_to_market"] or fb.venn.unique_to_market,
            ),
            market_pivots=parsed["pivots"] or fb.market_pivots,
            monetization=parsed["monetization"] or fb.monetization,
        )
    except Exception as e:
        print(f"positioning_service: fallback strategy ({e})")
        return _fallback_strategy()

