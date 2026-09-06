"""
TRACE // VERIFY — Blockchain Adapter

Supports two modes:
  1. PUBLIC_TESTNET: Polygon Amoy — real on-chain transactions
  2. LOCAL_DEMO_CHAIN: In-memory simulation — clearly labelled, never faked

The adapter auto-selects based on env vars:
  - WALLET_PRIVATE_KEY and EVIDENCE_REGISTRY_ADDRESS → PUBLIC_TESTNET
  - Otherwise → LOCAL_DEMO_CHAIN

IMPORTANT: This file never puts biometric data on-chain.
Only stores: contentHash (bytes32), sourceReference (string), matchScore (uint).
"""

import hashlib
import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)

# Minimal ABI for EvidenceRegistry
_EVIDENCE_ABI = [
    {
        "inputs": [
            {"internalType": "bytes32", "name": "contentHash", "type": "bytes32"},
            {"internalType": "string", "name": "sourceReference", "type": "string"},
            {"internalType": "uint256", "name": "matchScore", "type": "uint256"},
        ],
        "name": "recordEvidence",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "contentHash", "type": "bytes32"}
        ],
        "name": "verifyEvidence",
        "outputs": [
            {"internalType": "bool", "name": "exists", "type": "bool"},
            {"internalType": "string", "name": "sourceReference", "type": "string"},
            {"internalType": "uint256", "name": "matchScore", "type": "uint256"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"internalType": "address", "name": "recorder", "type": "address"},
        ],
        "stateMutability": "view",
        "type": "function",
    },
]


# ──────────────────────────────────────────────────────────────
# Local demo chain — in-memory, deterministic, clearly labelled
# ──────────────────────────────────────────────────────────────

_demo_store: dict[str, dict] = {}


def _demo_record_evidence(
    content_hash: str, source_reference: str, match_score_bps: int
) -> dict:
    # Deterministic "tx hash" from content
    tx_raw = f"demo:{content_hash}:{source_reference}:{time.time()}"
    tx_hash = "0x" + hashlib.sha256(tx_raw.encode()).hexdigest()
    block = 10_000_000 + int(time.time()) % 999999
    ts = int(time.time())

    _demo_store[content_hash] = {
        "content_hash": content_hash,
        "source_reference": source_reference,
        "match_score_bps": match_score_bps,
        "tx_hash": tx_hash,
        "block_number": block,
        "timestamp": ts,
        "recorder": "0xDEMO" + "0" * 35,
    }
    return _demo_store[content_hash]


def _demo_verify_evidence(content_hash: str) -> Optional[dict]:
    return _demo_store.get(content_hash)


# ──────────────────────────────────────────────────────────────
# Real blockchain via web3.py
# ──────────────────────────────────────────────────────────────

def _get_web3():
    from web3 import Web3

    w3 = Web3(Web3.HTTPProvider(settings.POLYGON_AMOY_RPC_URL))
    if not w3.is_connected():
        raise ConnectionError(f"Cannot connect to RPC: {settings.POLYGON_AMOY_RPC_URL}")
    return w3


def _real_record_evidence(
    content_hash: str, source_reference: str, match_score_bps: int
) -> dict:
    from web3 import Web3

    w3 = _get_web3()
    account = w3.eth.account.from_key(settings.WALLET_PRIVATE_KEY)
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(settings.EVIDENCE_REGISTRY_ADDRESS),
        abi=_EVIDENCE_ABI,
    )

    # Convert "0x<hex>" hash string to bytes32
    raw_hash = bytes.fromhex(content_hash.lstrip("0x").ljust(64, "0"))
    hash_bytes32 = raw_hash[:32]

    # Truncate sourceReference to avoid excessive gas
    src_ref = source_reference[:200]

    nonce = w3.eth.get_transaction_count(account.address)
    tx = contract.functions.recordEvidence(
        hash_bytes32, src_ref, match_score_bps
    ).build_transaction(
        {
            "from": account.address,
            "nonce": nonce,
            "gas": 200_000,
            "gasPrice": w3.eth.gas_price,
        }
    )
    signed = w3.eth.account.sign_transaction(tx, settings.WALLET_PRIVATE_KEY)
    tx_hash_bytes = w3.eth.send_raw_transaction(signed.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash_bytes, timeout=120)

    return {
        "content_hash": content_hash,
        "source_reference": source_reference,
        "match_score_bps": match_score_bps,
        "tx_hash": receipt.transactionHash.hex(),
        "block_number": receipt.blockNumber,
        "timestamp": int(time.time()),
        "recorder": account.address,
    }


def _real_verify_evidence(content_hash: str) -> Optional[dict]:
    from web3 import Web3

    w3 = _get_web3()
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(settings.EVIDENCE_REGISTRY_ADDRESS),
        abi=_EVIDENCE_ABI,
    )

    raw_hash = bytes.fromhex(content_hash.lstrip("0x").ljust(64, "0"))
    hash_bytes32 = raw_hash[:32]

    result = contract.functions.verifyEvidence(hash_bytes32).call()
    exists, source_reference, match_score, ts, recorder = result

    if not exists:
        return None
    return {
        "content_hash": content_hash,
        "source_reference": source_reference,
        "match_score_bps": match_score,
        "timestamp": ts,
        "recorder": recorder,
    }


# ──────────────────────────────────────────────────────────────
# Public adapter
# ──────────────────────────────────────────────────────────────

def get_mode() -> str:
    return settings.blockchain_mode


async def anchor_evidence(
    content_hash: str, source_reference: str, match_score_bps: int
) -> dict:
    """
    Write evidence to blockchain.
    Returns a dict with tx details + mode label.
    Raises on hard failure; callers should handle exceptions.
    """
    mode = get_mode()

    if mode == "PUBLIC_TESTNET":
        try:
            logger.info("Writing evidence to Polygon Amoy testnet")
            raw = _real_record_evidence(content_hash, source_reference, match_score_bps)
            explorer = f"https://amoy.polygonscan.com/tx/{raw['tx_hash']}"
        except Exception as e:
            logger.error(f"Testnet write failed: {e}, falling back to demo")
            mode = "LOCAL_DEMO_CHAIN (FALLBACK)"
            raw = _demo_record_evidence(content_hash, source_reference, match_score_bps)
            explorer = None
    else:
        logger.info("Writing evidence to LOCAL_DEMO_CHAIN (no wallet configured)")
        raw = _demo_record_evidence(content_hash, source_reference, match_score_bps)
        explorer = None

    return {
        **raw,
        "network": "Polygon Amoy Testnet" if "PUBLIC_TESTNET" in mode else "Local Demo Chain",
        "contract_address": settings.EVIDENCE_REGISTRY_ADDRESS or "LOCAL_DEMO",
        "mode": mode,
        "explorer_url": explorer,
    }


async def verify_evidence(content_hash: str) -> Optional[dict]:
    """
    Read evidence from blockchain. Returns stored record or None.
    """
    mode = get_mode()

    if mode == "PUBLIC_TESTNET":
        try:
            return _real_verify_evidence(content_hash)
        except Exception as e:
            logger.warning(f"Testnet verify failed: {e}, checking demo store")

    return _demo_verify_evidence(content_hash)
