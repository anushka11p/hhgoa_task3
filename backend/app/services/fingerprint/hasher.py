"""
TRACE // VERIFY — SHA-256 Content Fingerprinting

Computes the cryptographic fingerprint of discovered content.
The fingerprint is what gets stored on-chain — NOT the face embedding.
"""

import hashlib
import logging
from typing import Optional
import httpx

logger = logging.getLogger(__name__)


def compute_sha256(data: bytes) -> str:
    """Return SHA-256 hex digest prefixed with '0x'."""
    return "0x" + hashlib.sha256(data).hexdigest()


def compute_sha256_str(text: str, encoding: str = "utf-8") -> str:
    return compute_sha256(text.encode(encoding))


async def fetch_and_hash(url: str) -> tuple[Optional[bytes], Optional[str]]:
    """
    Fetch URL content and return (raw_bytes, sha256_hex).
    Returns (None, None) if fetch fails.
    """
    try:
        async with httpx.AsyncClient(
            timeout=15,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (compatible; TraceVerifyBot/1.0)"},
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.content
            return data, compute_sha256(data)
    except Exception as e:
        logger.warning(f"Could not fetch {url} for hashing: {e}")
        return None, None


def tamper_simulate(data: bytes) -> bytes:
    """
    Return a byte-modified version of data (flips last byte of first chunk)
    to demonstrate tamper detection without altering original.
    """
    if not data:
        return data
    arr = bytearray(data)
    # Flip a byte in the middle of the content
    mid = len(arr) // 2
    arr[mid] ^= 0xFF
    return bytes(arr)
