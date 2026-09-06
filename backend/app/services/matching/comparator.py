"""
TRACE // VERIFY — Candidate Matching Service

Downloads candidate images, runs face detection + embedding,
computes cosine similarity against the query embedding, and ranks results.
"""

import io
import logging
import asyncio
from typing import List, Optional, Tuple
import numpy as np
import httpx
from PIL import Image

from app.services.face.detector import detect_and_embed, compute_similarity
from app.services.search.providers import CandidateLink
from app.models.investigation import CandidateMatch
from app.config import settings

logger = logging.getLogger(__name__)

_DOWNLOAD_TIMEOUT = 10  # seconds
_MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB


async def _download_image(url: str) -> Optional[bytes]:
    """Download an image from a URL, respecting size and timeout limits."""
    try:
        async with httpx.AsyncClient(
            timeout=_DOWNLOAD_TIMEOUT,
            headers={"User-Agent": "Mozilla/5.0 (compatible; TraceVerifyBot/1.0)"},
            follow_redirects=True,
        ) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return None
            content_type = resp.headers.get("content-type", "")
            if "image" not in content_type and "jpeg" not in url and "png" not in url:
                return None
            data = resp.content
            if len(data) > _MAX_IMAGE_BYTES:
                return None
            return data
    except Exception as e:
        logger.debug(f"Failed to download image {url}: {e}")
        return None


def _image_bytes_to_temp_path(data: bytes, candidate_idx: int) -> str:
    """Save image bytes to a temp file and return its path."""
    import tempfile
    import os

    suffix = ".jpg"
    # Detect PNG
    if data[:4] == b"\x89PNG":
        suffix = ".png"
    fd, path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, "wb") as f:
        f.write(data)
    return path


async def rank_candidates(
    links: List[CandidateLink],
    query_embedding: np.ndarray,
    threshold: float,
) -> Tuple[List[CandidateMatch], Optional[CandidateMatch]]:
    """
    For each candidate link:
      1. Download the image
      2. Detect face + generate embedding
      3. Compute cosine similarity
      4. Build a CandidateMatch if face detected

    Returns (all_matches_sorted, best_match_or_None).
    """
    import os

    matches: List[CandidateMatch] = []

    # Run in limited concurrency
    sem = asyncio.Semaphore(4)

    async def process_link(link: CandidateLink, idx: int) -> Optional[CandidateMatch]:
        async with sem:
            img_url = link.image_url or link.url
            data = await _download_image(img_url)
            if data is None:
                logger.debug(f"Candidate {idx}: could not download {img_url}")
                return None

            tmp_path = _image_bytes_to_temp_path(data, idx)
            try:
                det_result, emb = detect_and_embed(tmp_path)
            finally:
                try:
                    os.unlink(tmp_path)
                except Exception:
                    pass

            if not det_result.get("detected") or emb is None:
                logger.debug(f"Candidate {idx}: no face detected at {img_url}")
                return None

            sim = compute_similarity(query_embedding, emb)
            logger.info(f"Candidate {idx} ({link.domain}): similarity={sim:.3f}")

            import hashlib
            content_hash = "0x" + hashlib.sha256(data).hexdigest()

            return CandidateMatch(
                url=link.url,
                image_url=img_url,
                domain=link.domain,
                title=link.title,
                similarity=sim,
                content_hash=content_hash,
                snippet=link.snippet,
                search_provider=link.provider,
            )

    tasks = [process_link(link, i) for i, link in enumerate(links)]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for r in results:
        if isinstance(r, CandidateMatch):
            matches.append(r)

    # Sort by similarity descending
    matches.sort(key=lambda m: m.similarity, reverse=True)

    best = matches[0] if matches and matches[0].similarity >= threshold else None
    return matches, best
