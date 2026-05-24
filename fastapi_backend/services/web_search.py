"""
Reliable web search for Project Intel (competitors + PDF discovery).

The `ddgs` library's `auto` backend fans out to Wikipedia, Yandex, Yahoo, etc. and is
slow/noisy. ddgs 9.x removed Bing; we use Brave then Google explicitly.
"""

from __future__ import annotations

from typing import Any

SEARCH_TIMEOUT_SEC = 12
# ddgs 9.x: brave, duckduckgo, google, mojeek, … (no bing)
DEFAULT_BACKENDS = ("brave", "duckduckgo", "google", "mojeek")
MAX_QUERY_LEN = 220


def _normalize_result(item: Any) -> dict[str, str]:
    if isinstance(item, dict):
        return {
            "title": str(item.get("title") or "").strip(),
            "body": str(item.get("body") or item.get("snippet") or "").strip(),
            "href": str(item.get("href") or item.get("link") or item.get("url") or "").strip(),
        }
    return {"title": "", "body": "", "href": ""}


def web_search(query: str, max_results: int = 6) -> list[dict[str, str]]:
    """
    Run a web text search. Returns list of {title, body, href}.
    Tries Brave, Google, then Mojeek; never uses `auto`.
    """
    q = (query or "").strip()[:MAX_QUERY_LEN]
    if not q:
        return []

    last_error: Exception | None = None

    try:
        from ddgs import DDGS
    except ImportError:
        DDGS = None  # type: ignore

    if DDGS is not None:
        for backend in DEFAULT_BACKENDS:
            try:
                with DDGS(timeout=SEARCH_TIMEOUT_SEC) as client:
                    raw = list(
                        client.text(
                            q,
                            max_results=max_results,
                            backend=backend,
                        )
                    )
                if raw:
                    return [_normalize_result(r) for r in raw]
            except Exception as e:
                last_error = e
                print(f"web_search: ddgs backend={backend} failed: {e}")

    # Legacy package (duckduckgo-search 8.x) — same backend order when ddgs not installed
    try:
        from duckduckgo_search import DDGS as LegacyDDGS

        for backend in DEFAULT_BACKENDS:
            try:
                with LegacyDDGS(timeout=SEARCH_TIMEOUT_SEC) as client:
                    raw = list(
                        client.text(
                            q,
                            max_results=max_results,
                            backend=backend,
                        )
                    )
                if raw:
                    return [_normalize_result(r) for r in raw]
            except Exception as e:
                last_error = e
                print(f"web_search: duckduckgo_search backend={backend} failed: {e}")
    except ImportError:
        pass
    except Exception as e:
        last_error = e
        print(f"web_search: duckduckgo_search failed: {e}")

    if last_error:
        print(f"web_search: all backends failed for query={q[:60]!r}...")
    return []


def web_search_summary(query: str, max_results: int = 6) -> str:
    """Plain-text blob for market / competitor context."""
    results = web_search(query, max_results=max_results)
    if not results:
        return ""
    parts: list[str] = []
    for r in results:
        title = r.get("title") or ""
        body = r.get("body") or ""
        href = r.get("href") or ""
        if not (title or body):
            continue
        line = title
        if body:
            line = f"{line}: {body}" if line else body
        if href:
            line = f"{line} {href}".strip()
        parts.append(line)
    return "\n".join(parts)
