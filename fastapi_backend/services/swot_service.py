from __future__ import annotations

import json
from typing import Any, Dict, List

from fastapi_backend.core.config import settings
from fastapi_backend.schemas.analysis import SWOTBlock



def _fallback_swot() -> SWOTBlock:
    return SWOTBlock(
        strengths=[
            "Clear problem statement and defined user persona",
            "Modern stack aligns with hiring market expectations",
            "Room to differentiate on workflow UX",
        ],
        weaknesses=[
            "Overlap with several well-funded competitors",
            "Limited moat if features remain generic",
        ],
        opportunities=[
            "Niche vertical packaging (e.g. education, compliance)",
            "Partnerships with existing data providers",
        ],
        threats=[
            "Rapid LLM commoditization of baseline features",
            "Platform risk if relying on a single vendor API",
        ],
    )


def _clean_points(v: Any) -> List[str]:
    if not isinstance(v, list):
        return []
    out: List[str] = []
    for item in v:
        if not isinstance(item, str):
            continue
        s = item.strip()
        if s:
            out.append(s[:220])
    return out[:3]


def _parse_swot_json(content: str) -> Dict[str, List[str]]:
    data = json.loads(content)
    if not isinstance(data, dict):
        raise ValueError("SWOT response was not a JSON object")
    return {
        "strengths": _clean_points(data.get("strengths")),
        "weaknesses": _clean_points(data.get("weaknesses")),
        "opportunities": _clean_points(data.get("opportunities")),
        "threats": _clean_points(data.get("threats")),
    }


def generate_swot_analysis(
    title: str,
    description: str,
    file_content: str,
    similarity_score: float,
    market_snippet: str,
    my_tech_stack: str = "",
) -> SWOTBlock:
    """
    Generate SWOT via Groq JSON mode. Falls back to local template on any failure.
    """
    api_key = (getattr(settings, "GROQ_API_KEY", "") or "").strip()
    if not api_key:
        return _fallback_swot()

    try:
        from groq import Groq

        client = Groq(api_key=api_key)
        prompt = f"""
You are a professional startup strategy consultant.
Analyze this project and return SWOT as JSON only.

IMPORTANT: Base your analysis on the DOCUMENT BODY below — not only the title.
The title and description are metadata; the document body is the actual project content.

PROJECT TITLE (metadata): {title}
SHORT DESCRIPTION (metadata): {description}
TECH STACK: {my_tech_stack or "Not specified"}
SIMILARITY SCORE: {round(similarity_score)}%
MARKET CONTEXT SNIPPET: {market_snippet[:600]}

DOCUMENT BODY (primary — analyze this):
{file_content[:8000]}

Rules:
- Provide exactly 2-3 concise bullets per quadrant grounded in the document body.
- Do not invent features that are not supported by the document body.
- No markdown, no prose, JSON only.

Required JSON schema:
{{
  "strengths": ["..."],
  "weaknesses": ["..."],
  "opportunities": ["..."],
  "threats": ["..."]
}}
""".strip()

        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a strategic analyst. Output only valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )

        raw = completion.choices[0].message.content or "{}"
        parsed = _parse_swot_json(raw)

        swot = SWOTBlock(
            strengths=parsed["strengths"],
            weaknesses=parsed["weaknesses"],
            opportunities=parsed["opportunities"],
            threats=parsed["threats"],
        )

        # Ensure each quadrant has something meaningful even if model output is sparse.
        fb = _fallback_swot()
        if not swot.strengths:
            swot.strengths = fb.strengths
        if not swot.weaknesses:
            swot.weaknesses = fb.weaknesses
        if not swot.opportunities:
            swot.opportunities = fb.opportunities
        if not swot.threats:
            swot.threats = fb.threats
        return swot

    except Exception as e:
        print(f"swot_service: falling back to template SWOT ({e})")
        return _fallback_swot()

