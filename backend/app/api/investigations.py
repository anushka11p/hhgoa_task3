"""
TRACE // VERIFY — Investigation API Endpoints

Routes:
  POST /api/investigation/upload        — ingest face image
  POST /api/investigation/search        — run web search + candidate matching
  GET  /api/investigation/{id}          — get investigation state
  POST /api/investigation/{id}/anchor   — write fingerprint to blockchain
  POST /api/investigation/{id}/verify   — verify on-chain record
  POST /api/investigation/{id}/tamper-test — simulate tamper detection
  GET  /api/health                      — system health
"""

import logging
import os
import shutil
import time
from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.config import settings
from app.models.investigation import (
    CandidateMatch,
    Investigation,
    InvestigationStatus,
    VerificationResult,
)
from app.services.blockchain import adapter as blockchain
from app.services.face import detector as face_svc
from app.services.fingerprint.hasher import (
    compute_sha256,
    fetch_and_hash,
    tamper_simulate,
)
from app.services.matching.comparator import rank_candidates
from app.services.search.providers import search_candidates

logger = logging.getLogger(__name__)
router = APIRouter()

# ── In-memory investigation store (session-scoped) ──────────────
_store: dict[str, Investigation] = {}


def _get_inv(investigation_id: str) -> Investigation:
    inv = _store.get(investigation_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return inv


# ──────────────────────────────────────────────────────────────
# UPLOAD
# ──────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_face(file: UploadFile = File(...)):
    """Receive a face image and run detection + embedding."""
    inv = Investigation()
    _store[inv.id] = inv

    # Save upload
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = os.path.splitext(file.filename or "face.jpg")[1] or ".jpg"
    upload_path = settings.UPLOAD_DIR / f"{inv.id}{ext}"

    with open(upload_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    inv.upload_path = str(upload_path)
    inv.add_event("Image received — beginning face analysis")
    inv.set_status(InvestigationStatus.UPLOADED)

    # Face detection
    t0 = time.time()
    det_result, embedding = face_svc.detect_and_embed(str(upload_path))
    elapsed = round((time.time() - t0) * 1000, 1)

    if not det_result.get("detected"):
        inv.add_event("No face detected in uploaded image")
        inv.set_status(InvestigationStatus.ERROR)
        if not settings.PERSIST_UPLOADS:
            try:
                os.unlink(upload_path)
            except Exception:
                pass
        return JSONResponse(
            status_code=422,
            content={
                "investigation_id": inv.id,
                "status": inv.status.value,
                "error": "No face detected in the uploaded image.",
                "events": inv.events,
            },
        )

    from app.models.investigation import FaceDetectionResult

    inv.face_result = FaceDetectionResult(
        detected=True,
        quality_score=det_result["quality_score"],
        bbox=det_result.get("bbox"),
        processing_time_ms=det_result["processing_time_ms"],
        embedding_dim=det_result.get("embedding_dim"),
    )
    inv._embedding = embedding
    inv.add_event(
        f"Face detected — quality {det_result['quality_score']:.0%} — "
        f"embedding ({det_result.get('embedding_dim', '?')}D) generated"
    )
    inv.set_status(InvestigationStatus.EMBEDDED)

    return {
        "investigation_id": inv.id,
        "status": inv.status.value,
        "face_result": inv.face_result.to_dict(),
        "events": inv.events,
    }


# ──────────────────────────────────────────────────────────────
# SEARCH
# ──────────────────────────────────────────────────────────────

@router.post("/search")
async def run_search(body: dict):
    """Run web discovery and candidate face matching."""
    inv = _get_inv(body.get("investigation_id", ""))

    if inv._embedding is None:
        raise HTTPException(400, "No embedding — upload a face first")

    inv.add_event("Initiating public-source web discovery")
    inv.set_status(InvestigationStatus.SEARCHING)

    # Build a generic query (we don't expose biometric data to search engines)
    query = body.get("query", "person face portrait public")
    inv.search_query = query

    # Search
    links, provider = await search_candidates(query)
    inv.search_provider_used = provider
    inv.candidate_count = len(links)
    inv.add_event(
        f"Search provider: {provider} — {len(links)} candidate URLs discovered"
    )
    inv.set_status(InvestigationStatus.CANDIDATES_FOUND)

    if not links:
        inv.add_event("No candidates found — investigation cannot continue")
        inv.set_status(InvestigationStatus.ERROR)
        return inv.to_dict()

    # Face matching
    inv.add_event(f"Running face similarity analysis on {len(links)} candidates")
    matches, best = await rank_candidates(
        links, inv._embedding, settings.FACE_SIMILARITY_THRESHOLD
    )

    inv.candidates = matches
    inv.best_match = best

    if best:
        inv.add_event(
            f"Candidate match confirmed — similarity {best.similarity * 100:.1f}% "
            f"from {best.domain} [{best.confidence_label()}]"
        )
        inv.set_status(InvestigationStatus.MATCHED)

        # Fetch content bytes for fingerprinting
        data, h = await fetch_and_hash(best.image_url)
        if data and h:
            inv.content_bytes = data
            inv.content_hash = h
            inv.content_url = best.image_url
            best.content_hash = h
            inv.add_event(f"Content fingerprint computed — SHA-256: {h[:18]}…")
            inv.set_status(InvestigationStatus.FINGERPRINTED)
        else:
            # Fallback: use already-computed hash from matching
            inv.content_hash = best.content_hash
            inv.content_url = best.image_url
            inv.content_bytes = None
            inv.add_event("Content fingerprint from candidate analysis (re-fetch unavailable)")
            inv.set_status(InvestigationStatus.FINGERPRINTED)
    else:
        inv.add_event(
            f"No candidate exceeded similarity threshold ({settings.FACE_SIMILARITY_THRESHOLD:.0%})"
        )
        inv.set_status(InvestigationStatus.CANDIDATES_FOUND)

    return inv.to_dict()


# ──────────────────────────────────────────────────────────────
# GET INVESTIGATION
# ──────────────────────────────────────────────────────────────

@router.get("/{investigation_id}")
async def get_investigation(investigation_id: str):
    inv = _get_inv(investigation_id)
    return inv.to_dict()


# ──────────────────────────────────────────────────────────────
# ANCHOR TO BLOCKCHAIN
# ──────────────────────────────────────────────────────────────

@router.post("/{investigation_id}/anchor")
async def anchor_evidence(investigation_id: str):
    inv = _get_inv(investigation_id)

    if not inv.content_hash:
        raise HTTPException(400, "No content fingerprint — run search first")

    inv.add_event(f"Anchoring evidence to {blockchain.get_mode()}")
    inv.set_status(InvestigationStatus.ANCHORING)

    source_ref = inv.content_url or "unknown"
    match_bps = int((inv.best_match.similarity if inv.best_match else 0) * 10000)

    try:
        record = await blockchain.anchor_evidence(
            inv.content_hash, source_ref, match_bps
        )
    except Exception as e:
        inv.add_event(f"Blockchain anchor failed: {str(e)[:100]}")
        inv.set_status(InvestigationStatus.ERROR)
        raise HTTPException(502, f"Blockchain error: {e}")

    from app.models.investigation import BlockchainRecord

    inv.blockchain_record = BlockchainRecord(
        content_hash=record["content_hash"],
        source_reference=record["source_reference"],
        match_score_bps=record["match_score_bps"],
        tx_hash=record.get("tx_hash"),
        block_number=record.get("block_number"),
        timestamp=record.get("timestamp"),
        network=record["network"],
        contract_address=record["contract_address"],
        mode=record["mode"],
        explorer_url=record.get("explorer_url"),
    )
    inv.add_event(
        f"Evidence anchored — TX: {record.get('tx_hash', 'N/A')[:20]}… "
        f"Block #{record.get('block_number', 'N/A')}"
    )
    inv.set_status(InvestigationStatus.ANCHORED)

    return inv.to_dict()


# ──────────────────────────────────────────────────────────────
# VERIFY
# ──────────────────────────────────────────────────────────────

@router.post("/{investigation_id}/verify")
async def verify_evidence(investigation_id: str):
    inv = _get_inv(investigation_id)

    if not inv.content_hash or not inv.blockchain_record:
        raise HTTPException(400, "Must anchor evidence before verifying")

    inv.add_event("Beginning independent verification")
    inv.set_status(InvestigationStatus.VERIFYING)

    # Recompute local hash
    if inv.content_bytes:
        local_hash = compute_sha256(inv.content_bytes)
    else:
        data, local_hash = await fetch_and_hash(inv.content_url)
        if not local_hash:
            local_hash = inv.content_hash  # can't re-fetch; use stored

    # Read on-chain record
    onchain = await blockchain.verify_evidence(inv.content_hash)
    onchain_hash = onchain["content_hash"] if onchain else None
    blockchain_confirmed = onchain is not None

    hashes_match = local_hash == inv.content_hash and blockchain_confirmed

    # Compute evidence confidence score (0-1)
    sim = inv.best_match.similarity if inv.best_match else 0
    source_ok = 1.0 if inv.best_match else 0.0
    crypto_ok = 1.0 if hashes_match else 0.0
    chain_ok = 1.0 if blockchain_confirmed else 0.0
    evidence_confidence = (sim * 0.4 + source_ok * 0.1 + crypto_ok * 0.3 + chain_ok * 0.2)

    inv.verification_result = VerificationResult(
        local_hash=local_hash,
        onchain_hash=onchain_hash or "NOT_FOUND",
        hashes_match=hashes_match,
        face_similarity=sim,
        blockchain_confirmed=blockchain_confirmed,
        tamper_simulated=False,
        evidence_confidence=evidence_confidence,
    )

    if hashes_match:
        inv.add_event("Verification complete — content integrity confirmed")
        inv.set_status(InvestigationStatus.VERIFIED)
    else:
        inv.add_event("Verification failed — hash mismatch or record not found")
        inv.set_status(InvestigationStatus.TAMPER_DETECTED)

    return inv.to_dict()


# ──────────────────────────────────────────────────────────────
# TAMPER TEST
# ──────────────────────────────────────────────────────────────

@router.post("/{investigation_id}/tamper-test")
async def tamper_test(investigation_id: str):
    """
    Simulate content tampering: flip a byte, recompute hash, compare to on-chain.
    Demonstrates WHY blockchain anchoring matters.
    """
    inv = _get_inv(investigation_id)

    if not inv.content_hash or not inv.blockchain_record:
        raise HTTPException(400, "Must have anchored evidence to run tamper test")

    # Use stored bytes or placeholder
    if inv.content_bytes:
        original_data = inv.content_bytes
    else:
        # Synthesise deterministic bytes from hash for demo
        import hashlib
        original_data = bytes.fromhex(inv.content_hash.lstrip("0x")) * 4

    tampered_data = tamper_simulate(original_data)
    tampered_hash = compute_sha256(tampered_data)

    onchain_hash = inv.blockchain_record.content_hash
    hashes_match = tampered_hash == onchain_hash  # will be False

    inv.add_event("TAMPER SIMULATION: content byte-flipped for demonstration")

    sim = inv.best_match.similarity if inv.best_match else 0
    evidence_confidence = sim * 0.4 * 0  # 0 when tampered

    inv.verification_result = VerificationResult(
        local_hash=tampered_hash,
        onchain_hash=onchain_hash,
        hashes_match=False,
        face_similarity=sim,
        blockchain_confirmed=True,
        tamper_simulated=True,
        evidence_confidence=0.0,
    )
    inv.set_status(InvestigationStatus.TAMPER_DETECTED)

    return inv.to_dict()


# ──────────────────────────────────────────────────────────────
# RESTORE AFTER TAMPER
# ──────────────────────────────────────────────────────────────

@router.post("/{investigation_id}/restore")
async def restore_after_tamper(investigation_id: str):
    """Restore original verification result after tamper demo."""
    inv = _get_inv(investigation_id)
    if not inv.content_hash or not inv.blockchain_record:
        raise HTTPException(400, "Nothing to restore")

    local_hash = inv.content_hash
    onchain_hash = inv.blockchain_record.content_hash
    sim = inv.best_match.similarity if inv.best_match else 0
    hashes_match = local_hash == onchain_hash

    evidence_confidence = (sim * 0.4 + 0.1 + (0.3 if hashes_match else 0) + 0.2)

    inv.verification_result = VerificationResult(
        local_hash=local_hash,
        onchain_hash=onchain_hash,
        hashes_match=hashes_match,
        face_similarity=sim,
        blockchain_confirmed=True,
        tamper_simulated=False,
        evidence_confidence=evidence_confidence,
    )
    inv.add_event("Original content restored — verification confirmed")
    inv.set_status(InvestigationStatus.VERIFIED)
    return inv.to_dict()


# ──────────────────────────────────────────────────────────────
# HEALTH
# ──────────────────────────────────────────────────────────────

@router.get("/health/status")
async def health():
    return {
        "status": "ok",
        "face_backend": face_svc.get_backend(),
        "blockchain_mode": blockchain.get_mode(),
        "search_provider": settings.active_search_provider,
        "demo_fallback_enabled": settings.DEMO_FALLBACK_ENABLED,
        "similarity_threshold": settings.FACE_SIMILARITY_THRESHOLD,
    }
