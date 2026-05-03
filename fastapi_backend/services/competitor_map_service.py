"""Build a synthetic competitive positioning map for visualization (deterministic scores)."""

from __future__ import annotations

import hashlib
import re
from typing import List, Literal
from urllib.parse import urlparse

from fastapi_backend.schemas.analysis import CompetitorMapEntry, SimilarProjectItem

_LISTING_HOST_FRAGMENTS = (
    "producthunt.com",
    "crunchbase.com",
    "g2.com",
    "capterra.com",
    "alternativeto.net",
    "trustpilot.com",
    "ycombinator.com/companies",
    "github.com/topics",
    "wikipedia.org",
    "linkedin.com/company",
    "owler.com",
    "slashdot.org",
)

_LISTING_DESC_KEYWORDS = (
    "directory",
    "listing",
    "aggregator",
    "compare ",
    "comparison",
    "alternatives to",
    "best tools",
    "top 10",
    "roundup",
    "vs ",
    " versus ",
)

_LOCAL_TLD_HINTS = (".co.uk", ".uk", ".de", ".fr", ".nl", ".eu", ".ca", ".au", ".in", ".jp", ".nz", ".ie")


def _stable_score(seed: str, salt: int) -> float:
    h = hashlib.sha256(f"{seed}|{salt}".encode()).hexdigest()
    v = int(h[:8], 16) / 0xFFFFFFFF
    return round(12.0 + v * 76.0, 1)


def _is_global_player(url: str, description: str) -> bool:
    u = (url or "").lower()
    d = (description or "").lower()
    if any(x in u for x in _LISTING_HOST_FRAGMENTS):
        return True
    if any(k in d for k in _LISTING_DESC_KEYWORDS):
        return True
    try:
        host = urlparse(u).netloc.lower()
    except Exception:
        host = ""
    if host:
        if any(host.endswith(t) or host.endswith(t[1:]) for t in _LOCAL_TLD_HINTS if len(t) > 1):
            return False
    if re.search(r"\.(com|io|app|dev)(:\d+)?$", host) and len(d) > 80:
        if any(k in d for k in ("platform", "marketplace", "ecosystem", "community")):
            return True
    return False


_PALETTE = (
    "#0ea5e9",
    "#f59e0b",
    "#10b981",
    "#ec4899",
    "#8b5cf6",
    "#14b8a6",
    "#f97316",
    "#6366f1",
)


def build_competitor_map(
    company_name: str,
    description: str,
    found_projects: List[SimilarProjectItem],
) -> List[CompetitorMapEntry]:
    """User row first (is_you), then competitors derived from market search."""
    name = (company_name or "").strip() or "Your project"
    desc = (description or "").strip()
    seed_base = f"{name}|{desc[:120]}"

    out: List[CompetitorMapEntry] = [
        CompetitorMapEntry(
            name=name,
            description=desc[:800] if desc else "Your submission — positioned against market references.",
            url="",
            price_score=_stable_score(seed_base, 10),
            quality_score=_stable_score(seed_base, 11),
            local_support_score=_stable_score(seed_base, 12),
            market_share_score=_stable_score(seed_base, 13),
            color="#4f46e5",
            is_you=True,
            tag="Competitor",
        )
    ]

    for i, p in enumerate(found_projects):
        cname = (p.name or "").strip() or f"Competitor {i + 1}"
        snippet = (p.snippet or "").strip()
        link = (p.link or "").strip()
        tag: Literal["Competitor", "Global player"] = (
            "Global player" if _is_global_player(link, snippet) else "Competitor"
        )
        seed = f"{cname}|{link}|{snippet[:80]}"
        out.append(
            CompetitorMapEntry(
                name=cname,
                description=snippet[:800] if snippet else "No description extracted for this reference.",
                url=link,
                price_score=_stable_score(seed, 20),
                quality_score=_stable_score(seed, 21),
                local_support_score=_stable_score(seed, 22),
                market_share_score=_stable_score(seed, 23),
                color=_PALETTE[i % len(_PALETTE)],
                is_you=False,
                tag=tag,
            )
        )

    return out
