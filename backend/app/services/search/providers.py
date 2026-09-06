"""
TRACE // VERIFY — Search Provider Architecture

Provider chain:
  1. SerpAPI (Google Images reverse search via API)
  2. Bing Web Search API
  3. Google Custom Search API
  4. Demo Fallback (cached public domain images — CLEARLY LABELLED)

Each provider returns a list of CandidateLink objects (url + image_url + domain + title + snippet).
"""

import logging
import hashlib
from typing import List, Optional
from dataclasses import dataclass
import httpx

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class CandidateLink:
    url: str
    image_url: str
    domain: str
    title: str
    snippet: str
    provider: str


# ──────────────────────────────────────────────────────────────
# SerpAPI provider
# ──────────────────────────────────────────────────────────────

async def _search_serpapi(query: str, image_url: Optional[str] = None) -> List[CandidateLink]:
    """
    Use SerpAPI Google Reverse Image Search (lens endpoint) if image URL available,
    otherwise fall back to text-based image search.
    """
    candidates = []
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            params: dict = {"api_key": settings.SERPAPI_KEY, "engine": "google"}

            if image_url:
                params["engine"] = "google_reverse_image"
                params["image_url"] = image_url
            else:
                params["q"] = query
                params["tbm"] = "isch"  # image search

            resp = await client.get("https://serpapi.com/search", params=params)
            resp.raise_for_status()
            data = resp.json()

            # Parse inline images / organic results
            for item in data.get("inline_images", []) or data.get("image_results", []):
                url = item.get("link", "") or item.get("source", "")
                img = item.get("original", "") or item.get("thumbnail", "")
                if not url:
                    continue
                domain = _extract_domain(url)
                candidates.append(
                    CandidateLink(
                        url=url,
                        image_url=img,
                        domain=domain,
                        title=item.get("title", domain),
                        snippet=item.get("snippet", ""),
                        provider="serpapi",
                    )
                )

            # Also check image_sources for reverse image search
            for src in data.get("image_sources", []):
                url = src.get("link", "")
                img = src.get("thumbnail", "")
                if not url:
                    continue
                candidates.append(
                    CandidateLink(
                        url=url,
                        image_url=img,
                        domain=_extract_domain(url),
                        title=src.get("title", ""),
                        snippet="",
                        provider="serpapi",
                    )
                )

    except Exception as e:
        logger.warning(f"SerpAPI search failed: {e}")
    return candidates[:settings.MAX_CANDIDATES]


# ──────────────────────────────────────────────────────────────
# Bing Image Search API
# ──────────────────────────────────────────────────────────────

async def _search_bing(query: str) -> List[CandidateLink]:
    candidates = []
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            headers = {"Ocp-Apim-Subscription-Key": settings.BING_API_KEY}
            params = {"q": query, "count": settings.MAX_CANDIDATES, "mkt": "en-US"}
            resp = await client.get(
                "https://api.bing.microsoft.com/v7.0/images/search",
                headers=headers,
                params=params,
            )
            resp.raise_for_status()
            data = resp.json()
            for item in data.get("value", []):
                candidates.append(
                    CandidateLink(
                        url=item.get("hostPageUrl", ""),
                        image_url=item.get("contentUrl", ""),
                        domain=item.get("hostPageDisplayUrl", ""),
                        title=item.get("name", ""),
                        snippet="",
                        provider="bing",
                    )
                )
    except Exception as e:
        logger.warning(f"Bing search failed: {e}")
    return candidates


# ──────────────────────────────────────────────────────────────
# Google Custom Search API
# ──────────────────────────────────────────────────────────────

async def _search_google_cse(query: str) -> List[CandidateLink]:
    candidates = []
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            params = {
                "key": settings.GOOGLE_SEARCH_API_KEY,
                "cx": settings.GOOGLE_SEARCH_ENGINE_ID,
                "q": query,
                "searchType": "image",
                "num": min(settings.MAX_CANDIDATES, 10),
            }
            resp = await client.get(
                "https://www.googleapis.com/customsearch/v1", params=params
            )
            resp.raise_for_status()
            data = resp.json()
            for item in data.get("items", []):
                img_url = (
                    item.get("pagemap", {})
                    .get("cse_image", [{}])[0]
                    .get("src", "")
                )
                candidates.append(
                    CandidateLink(
                        url=item.get("link", ""),
                        image_url=img_url,
                        domain=item.get("displayLink", ""),
                        title=item.get("title", ""),
                        snippet=item.get("snippet", ""),
                        provider="google_cse",
                    )
                )
    except Exception as e:
        logger.warning(f"Google CSE search failed: {e}")
    return candidates


# ──────────────────────────────────────────────────────────────
# Demo Fallback (Public Domain faces for testing)
# Uses Wikipedia-licensed portrait images so no copyright issues
# ──────────────────────────────────────────────────────────────

_DEMO_CANDIDATES = [
    {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Gatto_europeo4.jpg/440px-Gatto_europeo4.jpg",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Gatto_europeo4.jpg/440px-Gatto_europeo4.jpg",
        "domain": "wikimedia.org",
        "title": "Public Domain — Wikimedia Commons",
        "snippet": "Demo fallback: public domain image from Wikimedia Commons.",
    },
    {
        "url": "https://thispersondoesnotexist.com/",
        "image_url": "https://thispersondoesnotexist.com/",
        "domain": "thispersondoesnotexist.com",
        "title": "AI-Generated Face (This Person Does Not Exist)",
        "snippet": "Demo fallback: GAN-generated synthetic face, no real person.",
    },
]

# Public-domain portrait images from Unsplash (free tier, no key needed)
_UNSPLASH_DEMO = [
    {
        "url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
        "image_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
        "domain": "unsplash.com",
        "title": "Unsplash — Free Portrait (Demo)",
        "snippet": "DEMO FALLBACK — public domain portrait for pipeline demonstration.",
    },
    {
        "url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
        "image_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
        "domain": "unsplash.com",
        "title": "Unsplash — Free Portrait 2 (Demo)",
        "snippet": "DEMO FALLBACK — public domain portrait for pipeline demonstration.",
    },
    {
        "url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        "domain": "unsplash.com",
        "title": "Unsplash — Free Portrait 3 (Demo)",
        "snippet": "DEMO FALLBACK — public domain portrait for pipeline demonstration.",
    },
]


async def _demo_fallback(query: str) -> List[CandidateLink]:
    logger.warning("Using DEMO FALLBACK search provider — results are NOT from live search")
    results = []
    for item in _UNSPLASH_DEMO:
        results.append(
            CandidateLink(
                url=item["url"],
                image_url=item["image_url"],
                domain=item["domain"],
                title=item["title"],
                snippet=item["snippet"],
                provider="DEMO_FALLBACK",
            )
        )
    return results


# ──────────────────────────────────────────────────────────────
# Public search dispatcher
# ──────────────────────────────────────────────────────────────

async def search_candidates(
    query: str,
    image_url: Optional[str] = None,
) -> tuple[List[CandidateLink], str]:
    """
    Try providers in order. Returns (candidates, provider_name).
    Never silently falls back without labelling.
    """
    if settings.SERPAPI_KEY:
        results = await _search_serpapi(query, image_url)
        if results:
            return results, "serpapi"

    if settings.BING_API_KEY:
        results = await _search_bing(query)
        if results:
            return results, "bing"

    if settings.GOOGLE_SEARCH_API_KEY and settings.GOOGLE_SEARCH_ENGINE_ID:
        results = await _search_google_cse(query)
        if results:
            return results, "google_cse"

    if settings.DEMO_FALLBACK_ENABLED:
        results = await _demo_fallback(query)
        return results, "DEMO_FALLBACK"

    return [], "none"


def _extract_domain(url: str) -> str:
    try:
        from urllib.parse import urlparse
        return urlparse(url).netloc
    except Exception:
        return url.split("/")[2] if "/" in url else url
