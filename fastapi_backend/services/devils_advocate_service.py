from __future__ import annotations

import json
from typing import Any, List

from fastapi_backend.core.config import settings


def _fallback_questions() -> List[str]:
    return [
        "If your similarity score is high, what concrete evidence proves original contribution beyond repackaging?",
        "Why would users pay every month instead of using a one-off free AI workflow?",
        "What prevents a larger incumbent from cloning your core value in a single release cycle?",
        "Which leading indicator will show this product still matters six months from now?",
    ]


def _clean_questions(v: Any) -> List[str]:
    if not isinstance(v, list):
        return []
    out: List[str] = []
    for item in v:
        if isinstance(item, str):
            s = item.strip()
            if s:
                out.append(s[:220])
    return out[:4]


def generate_devils_advocate_questions(
    project_title: str,
    project_description: str,
    similarity_score: float,
    market_snippet: str,
) -> List[str]:
    """
    Generate 4 hard stress-test questions via Groq.
    Falls back to a static set if API key or call is unavailable.
    """
    api_key = (getattr(settings, "GROQ_API_KEY", "") or "").strip()
    if not api_key:
        return _fallback_questions()

    try:
        from groq import Groq

        client = Groq(api_key=api_key)
        prompt = f"""
You are a skeptical VC + strict technical reviewer.
Project title: {project_title}
Project description: {project_description[:900]}
Similarity score: {round(similarity_score)}%
Market context: {market_snippet[:700]}

Generate exactly 4 short, sharp Devil's Advocate questions.
Must stress-test:
1) originality
2) monetization
3) defensibility
4) longevity

Return JSON object only:
{{
  "questions": ["q1", "q2", "q3", "q4"]
}}
""".strip()

        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a skeptical expert reviewer. Output only valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        raw = completion.choices[0].message.content or "{}"
        data = json.loads(raw)
        questions = _clean_questions(data.get("questions") if isinstance(data, dict) else None)
        if len(questions) == 4:
            return questions
        if questions:
            # Top up if model returned fewer than 4.
            fb = _fallback_questions()
            needed = 4 - len(questions)
            questions.extend(fb[:needed])
            return questions
        return _fallback_questions()
    except Exception as e:
        print(f"devils_advocate_service: fallback ({e})")
        return _fallback_questions()

