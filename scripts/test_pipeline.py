#!/usr/bin/env python3
"""
TRACE // VERIFY — Automated End-to-End Pipeline Verification Suite

Validates every module:
  [1] Face Detection & Embedding (synthetic / Haar / ArcFace)
  [2] Search Provider Chain & Candidate Discovery
  [3] Pairwise Cosine Distance & Match Ranking
  [4] SHA-256 Content Fingerprinting
  [5] Blockchain Storage (Local Demo Chain / Polygon Amoy)
  [6] Independent On-Chain Verification
  [7] Tamper Detection Check (bit mutation & failure assertion)
"""

import os
import sys
import asyncio
import hashlib
import numpy as np
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.config import settings
from app.services.face import detector as face_svc
from app.services.search.providers import search_candidates, CandidateLink
from app.services.matching.comparator import rank_candidates
from app.services.fingerprint.hasher import compute_sha256, tamper_simulate
from app.services.blockchain import adapter as blockchain
from app.models.investigation import Investigation, InvestigationStatus


def test_face_detection_and_embedding():
    print("------------------------------------------------------------")
    print("TEST 1: Face Detection & Feature Extraction")
    print("------------------------------------------------------------")
    # Generate a synthetic portrait test image with an oval "face"
    from PIL import Image, ImageDraw

    img = Image.new("RGB", (320, 320), color=(18, 30, 24))
    draw = ImageDraw.Draw(img)
    # Draw an oval skin-tone face
    draw.ellipse([80, 60, 240, 260], fill=(210, 160, 130), outline=(230, 180, 150))
    # Eyes
    draw.ellipse([110, 110, 140, 130], fill=(40, 40, 40))
    draw.ellipse([180, 110, 210, 130], fill=(40, 40, 40))
    # Mouth
    draw.arc([120, 180, 200, 220], start=0, end=180, fill=(150, 60, 60), width=3)

    test_img_path = Path(__file__).resolve().parent.parent / "demo" / "synthetic_test_face.jpg"
    test_img_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(test_img_path)

    det_result, embedding = face_svc.detect_and_embed(str(test_img_path))
    print(f"  Face Detected:    {det_result.get('detected')}")
    print(f"  Quality Rating:   {det_result.get('quality_score')}")
    print(f"  Backend Used:     {det_result.get('backend')}")
    print(f"  Extraction Time:  {det_result.get('processing_time_ms')} ms")
    assert embedding is not None, "Embedding should not be None"
    assert len(embedding) > 0, "Embedding length should be > 0"
    print("  ✓ PASS: Face detection and embedding generated successfully.\n")
    return embedding


async def test_search_and_matching(query_embedding):
    print("------------------------------------------------------------")
    print("TEST 2: Web Search Provider & Candidate Correlation")
    print("------------------------------------------------------------")
    query = "test forensic portrait person"
    candidates, provider = await search_candidates(query)
    print(f"  Search Provider Selected: {provider}")
    print(f"  Candidates Discovered:    {len(candidates)}")
    assert len(candidates) > 0, "Should return at least 1 candidate"

    print("\n------------------------------------------------------------")
    print("TEST 3: Cosine Similarity & Match Scoring")
    print("------------------------------------------------------------")
    matches, best = await rank_candidates(candidates, query_embedding, threshold=0.1)
    print(f"  Total Candidates Evaluated: {len(matches)}")
    if best:
        print(f"  Best Match Domain:    {best.domain}")
        print(f"  Similarity Score:     {best.similarity * 100:.1f}%")
        print(f"  Confidence Label:     {best.confidence_label()}")
    print("  ✓ PASS: Candidate matching and ranking completed.\n")


def test_sha256_fingerprint():
    print("------------------------------------------------------------")
    print("TEST 4: SHA-256 Content Fingerprinting")
    print("------------------------------------------------------------")
    sample_content = b"DISCOVERED_PUBLIC_IMAGE_BUFFER_DATA_12345"
    digest = compute_sha256(sample_content)
    print(f"  Generated Digest: {digest}")
    assert digest.startswith("0x"), "Digest must be 0x-prefixed hex"
    assert len(digest) == 66, f"0x + 64 hex chars = 66 chars, got {len(digest)}"
    print("  ✓ PASS: Cryptographic fingerprint calculated correctly.\n")
    return sample_content, digest


async def test_blockchain_and_verification(sample_content, content_hash):
    print("------------------------------------------------------------")
    print("TEST 5: Blockchain Ledger Anchoring")
    print("------------------------------------------------------------")
    source_ref = "https://example.org/public_evidence_target.jpg"
    match_bps = 9680  # 96.80%

    record = await blockchain.anchor_evidence(content_hash, source_ref, match_bps)
    print(f"  Mode:            {record['mode']}")
    print(f"  Network:         {record['network']}")
    print(f"  Tx Hash:         {record.get('tx_hash')}")
    print(f"  Block Number:    #{record.get('block_number')}")
    print(f"  Contract Addr:   {record.get('contract_address')}")
    assert record.get("tx_hash"), "Transaction hash must be present"
    print("  ✓ PASS: Evidence successfully anchored.\n")

    print("------------------------------------------------------------")
    print("TEST 6: Independent On-Chain Verification")
    print("------------------------------------------------------------")
    verified = await blockchain.verify_evidence(content_hash)
    assert verified is not None, "Evidence should exist on-chain"
    print(f"  On-Chain Record Found: True")
    print(f"  Verified Hash:         {verified['content_hash']}")
    assert verified["content_hash"] == content_hash
    print("  ✓ PASS: On-chain evidence matches local fingerprint bit-for-bit.\n")

    print("------------------------------------------------------------")
    print("TEST 7: Tamper Detection (1-Byte Mutation Assertion)")
    print("------------------------------------------------------------")
    tampered_bytes = tamper_simulate(sample_content)
    tampered_hash = compute_sha256(tampered_bytes)
    print(f"  Original Digest: {content_hash}")
    print(f"  Tampered Digest: {tampered_hash}")
    assert tampered_hash != content_hash, "Tampered digest MUST differ from original!"
    print("  ✓ PASS: Tamper detection verified. Bit divergence caught immediately.\n")


async def run_all_tests():
    print("\n============================================================")
    print("       TRACE // VERIFY  --  PIPELINE AUDIT SUITE           ")
    print("============================================================\n")
    emb = test_face_detection_and_embedding()
    await test_search_and_matching(emb)
    content_bytes, content_hash = test_sha256_fingerprint()
    await test_blockchain_and_verification(content_bytes, content_hash)
    print("============================================================")
    print("  ALL 7 TESTS PASSED SUCCESSFULLY - ZERO DEFECTS FOUND     ")
    print("============================================================\n")


if __name__ == "__main__":
    asyncio.run(run_all_tests())
