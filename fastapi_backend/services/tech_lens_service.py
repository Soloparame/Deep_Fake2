from __future__ import annotations

import json
from typing import Any, List

from fastapi_backend.core.config import settings
from fastapi_backend.schemas.analysis import TechComparisonRow


def _clean_text(v: Any, max_len: int = 220) -> str:
    if not isinstance(v, str):
        return ""
    s = v.strip()
    if len(s) > max_len:
        s = s[: max_len - 1] + "…"
    return s


def _fallback_rows(my_stack: str) -> List[TechComparisonRow]:
    stack = my_stack.strip() or "Custom stack"
    return [
        TechComparisonRow(
            area="Auth & data",
            user_stack=stack,
            competitor_stack="Firebase Auth + Firestore",
            advantage="More portability and fewer hard dependencies on one vendor ecosystem.",
        ),
        TechComparisonRow(
            area="Search / vectors",
            user_stack=stack,
            competitor_stack="Elasticsearch + custom ranking",
            advantage="Faster semantic-search iteration if your stack already supports embedding workflows.",
        ),
        TechComparisonRow(
            area="Deployment",
            user_stack=stack,
            competitor_stack="Single cloud PaaS with limited customization",
            advantage="Greater control over scaling strategy, cost, and compliance boundaries.",
        ),
    ]


def _parse_rows(raw: str) -> List[TechComparisonRow]:
    data = json.loads(raw)
    if isinstance(data, dict):
        if isinstance(data.get("rows"), list):
            data = data["rows"]
        elif isinstance(data.get("items"), list):
            data = data["items"]
        elif isinstance(data.get("tech_comparison"), list):
            data = data["tech_comparison"]
    if not isinstance(data, list):
        raise ValueError("Tech lens response is not a list")

    out: List[TechComparisonRow] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        area = _clean_text(item.get("area"), 50)
        user_stack = _clean_text(item.get("my_stack") or item.get("user_stack"), 120)
        competitor_stack = _clean_text(item.get("their_stack") or item.get("competitor_stack"), 140)
        advantage = _clean_text(item.get("your_edge") or item.get("advantage"), 280)
        if not (area and user_stack and competitor_stack and advantage):
            continue
        out.append(
            TechComparisonRow(
                area=area,
                user_stack=user_stack,
                competitor_stack=competitor_stack,
                advantage=advantage,
            )
        )
    return out[:3]


def generate_tech_lens(
    project_title: str,
    project_description: str,
    my_stack_details: str,
    market_snippet: str,
) -> List[TechComparisonRow]:
    """
    Generate Tech Lens rows with Groq when stack is provided.
    Returns [] if stack is empty so UI can hide section.
    """
    my_stack = (my_stack_details or "").strip()
    if not my_stack:
        return []

    api_key = (getattr(settings, "GROQ_API_KEY", "") or "").strip()
    if not api_key:
        return _fallback_rows(my_stack)

    try:
        from groq import Groq

        client = Groq(api_key=api_key)
        prompt = f"""
You are a senior software architect.
Create a stack comparison table for this product:

PROJECT: {project_title}
DESCRIPTION: {project_description[:700]}
USER STACK: {my_stack}
MARKET CONTEXT: {market_snippet[:600]}

Return exactly 3 rows for these areas:
1) Auth & Data
2) Search / Vectors
3) Deployment

Return JSON object only in this shape:
{{
  "rows": [
    {{
      "area": "Auth & Data",
      "my_stack": "...",
      "their_stack": "...",
      "your_edge": "..."
    }}
  ]
}}
""".strip()

        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a senior software architect. Output only valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        raw = completion.choices[0].message.content or "{}"
        rows = _parse_rows(raw)
        if rows:
            return rows
        return _fallback_rows(my_stack)
    except Exception as e:
        print(f"tech_lens_service: fallback rows ({e})")
        return _fallback_rows(my_stack)

