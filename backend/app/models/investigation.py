"""
TRACE // VERIFY — Investigation State Models
"""

from __future__ import annotations
from enum import Enum
from typing import Optional, List
from datetime import datetime
import uuid


class InvestigationStatus(str, Enum):
    UPLOADED = "UPLOADED"
    FACE_DETECTED = "FACE_DETECTED"
    EMBEDDED = "EMBEDDED"
    SEARCHING = "SEARCHING"
    CANDIDATES_FOUND = "CANDIDATES_FOUND"
    MATCHED = "MATCHED"
    FINGERPRINTED = "FINGERPRINTED"
    ANCHORING = "ANCHORING"
    ANCHORED = "ANCHORED"
    VERIFYING = "VERIFYING"
    VERIFIED = "VERIFIED"
    TAMPER_DETECTED = "TAMPER_DETECTED"
    ERROR = "ERROR"


class FaceDetectionResult:
    def __init__(
        self,
        detected: bool,
        quality_score: float,
        bbox: Optional[list],
        processing_time_ms: float,
        embedding_dim: Optional[int] = None,
    ):
        self.detected = detected
        self.quality_score = quality_score
        self.bbox = bbox  # [x1, y1, x2, y2] normalised
        self.processing_time_ms = processing_time_ms
        self.embedding_dim = embedding_dim

    def to_dict(self):
        return {
            "detected": self.detected,
            "quality_score": round(self.quality_score, 3),
            "bbox": self.bbox,
            "processing_time_ms": round(self.processing_time_ms, 1),
            "embedding_dim": self.embedding_dim,
        }


class CandidateMatch:
    def __init__(
        self,
        url: str,
        image_url: str,
        domain: str,
        title: str,
        similarity: float,
        content_hash: Optional[str] = None,
        snippet: Optional[str] = None,
        search_provider: str = "unknown",
        discovered_at: Optional[str] = None,
    ):
        self.url = url
        self.image_url = image_url
        self.domain = domain
        self.title = title
        self.similarity = similarity
        self.content_hash = content_hash
        self.snippet = snippet
        self.search_provider = search_provider
        self.discovered_at = discovered_at or datetime.utcnow().isoformat()

    def confidence_label(self) -> str:
        if self.similarity >= 0.75:
            return "MATCH"
        if self.similarity >= 0.55:
            return "POSSIBLE_MATCH"
        return "LOW_CONFIDENCE"

    def to_dict(self):
        return {
            "url": self.url,
            "image_url": self.image_url,
            "domain": self.domain,
            "title": self.title,
            "similarity": round(self.similarity, 4),
            "similarity_pct": round(self.similarity * 100, 1),
            "content_hash": self.content_hash,
            "snippet": self.snippet,
            "search_provider": self.search_provider,
            "discovered_at": self.discovered_at,
            "confidence_label": self.confidence_label(),
        }


class BlockchainRecord:
    def __init__(
        self,
        content_hash: str,
        source_reference: str,
        match_score_bps: int,
        tx_hash: Optional[str],
        block_number: Optional[int],
        timestamp: Optional[int],
        network: str,
        contract_address: Optional[str],
        mode: str,
        explorer_url: Optional[str] = None,
    ):
        self.content_hash = content_hash
        self.source_reference = source_reference
        self.match_score_bps = match_score_bps
        self.tx_hash = tx_hash
        self.block_number = block_number
        self.timestamp = timestamp
        self.network = network
        self.contract_address = contract_address
        self.mode = mode  # "PUBLIC_TESTNET" | "LOCAL_DEMO_CHAIN"
        self.explorer_url = explorer_url

    def to_dict(self):
        return {
            "content_hash": self.content_hash,
            "source_reference": self.source_reference,
            "match_score_bps": self.match_score_bps,
            "match_score_pct": round(self.match_score_bps / 100, 1),
            "tx_hash": self.tx_hash,
            "block_number": self.block_number,
            "timestamp": self.timestamp,
            "network": self.network,
            "contract_address": self.contract_address,
            "mode": self.mode,
            "explorer_url": self.explorer_url,
        }


class VerificationResult:
    def __init__(
        self,
        local_hash: str,
        onchain_hash: str,
        hashes_match: bool,
        face_similarity: float,
        blockchain_confirmed: bool,
        tamper_simulated: bool = False,
        evidence_confidence: float = 0.0,
    ):
        self.local_hash = local_hash
        self.onchain_hash = onchain_hash
        self.hashes_match = hashes_match
        self.face_similarity = face_similarity
        self.blockchain_confirmed = blockchain_confirmed
        self.tamper_simulated = tamper_simulated
        self.evidence_confidence = evidence_confidence

    def to_dict(self):
        return {
            "local_hash": self.local_hash,
            "onchain_hash": self.onchain_hash,
            "hashes_match": self.hashes_match,
            "face_similarity": round(self.face_similarity, 4),
            "blockchain_confirmed": self.blockchain_confirmed,
            "tamper_simulated": self.tamper_simulated,
            "evidence_confidence": round(self.evidence_confidence, 3),
            "tamper_status": "TAMPER_DETECTED" if not self.hashes_match else "NOT_ALTERED",
            "overall_result": "VERIFIED" if (self.hashes_match and self.blockchain_confirmed) else "FAILED",
        }


class Investigation:
    """Full investigation state, held in memory per session."""

    def __init__(self, investigation_id: str = None):
        self.id: str = investigation_id or str(uuid.uuid4())
        self.status: InvestigationStatus = InvestigationStatus.UPLOADED
        self.created_at: str = datetime.utcnow().isoformat()
        self.updated_at: str = self.created_at

        # Face data
        self.upload_path: Optional[str] = None
        self.face_result: Optional[FaceDetectionResult] = None
        # Embedding is held in memory only — never serialised to disk or chain
        self._embedding: Optional[object] = None

        # Search / matching
        self.candidates: List[CandidateMatch] = []
        self.best_match: Optional[CandidateMatch] = None
        self.search_provider_used: str = ""
        self.search_query: str = ""
        self.candidate_count: int = 0

        # Fingerprint
        self.content_hash: Optional[str] = None
        self.content_url: Optional[str] = None
        self.content_bytes: Optional[bytes] = None

        # Blockchain
        self.blockchain_record: Optional[BlockchainRecord] = None

        # Verification
        self.verification_result: Optional[VerificationResult] = None

        # Timeline events
        self.events: List[dict] = []

    def add_event(self, message: str):
        self.events.append(
            {"ts": datetime.utcnow().isoformat(), "message": message}
        )
        self.updated_at = datetime.utcnow().isoformat()

    def set_status(self, status: InvestigationStatus):
        self.status = status
        self.updated_at = datetime.utcnow().isoformat()

    def to_dict(self, include_sensitive: bool = False):
        return {
            "id": self.id,
            "status": self.status.value,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "face_result": self.face_result.to_dict() if self.face_result else None,
            "candidates": [c.to_dict() for c in self.candidates[:10]],
            "best_match": self.best_match.to_dict() if self.best_match else None,
            "candidate_count": self.candidate_count,
            "search_provider_used": self.search_provider_used,
            "search_query": self.search_query,
            "content_hash": self.content_hash,
            "content_url": self.content_url,
            "blockchain_record": (
                self.blockchain_record.to_dict() if self.blockchain_record else None
            ),
            "verification_result": (
                self.verification_result.to_dict() if self.verification_result else None
            ),
            "events": self.events,
        }
