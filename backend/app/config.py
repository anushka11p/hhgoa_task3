"""
TRACE // VERIFY — Configuration
Loads settings from environment variables with sensible defaults.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the project root (two levels up from this file)
_root = Path(__file__).resolve().parent.parent.parent
load_dotenv(_root / ".env")


class Settings:
    # Search providers
    SERPAPI_KEY: str = os.getenv("SERPAPI_KEY", "")
    BING_API_KEY: str = os.getenv("BING_API_KEY", "")
    GOOGLE_SEARCH_API_KEY: str = os.getenv("GOOGLE_SEARCH_API_KEY", "")
    GOOGLE_SEARCH_ENGINE_ID: str = os.getenv("GOOGLE_SEARCH_ENGINE_ID", "")

    # Blockchain
    POLYGON_AMOY_RPC_URL: str = os.getenv(
        "POLYGON_AMOY_RPC_URL", "https://rpc-amoy.polygon.technology"
    )
    WALLET_PRIVATE_KEY: str = os.getenv("WALLET_PRIVATE_KEY", "")
    EVIDENCE_REGISTRY_ADDRESS: str = os.getenv("EVIDENCE_REGISTRY_ADDRESS", "")

    # Backend
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
        ).split(",")
    ]

    # Behaviour
    DEMO_FALLBACK_ENABLED: bool = (
        os.getenv("DEMO_FALLBACK_ENABLED", "true").lower() == "true"
    )
    FACE_SIMILARITY_THRESHOLD: float = float(
        os.getenv("FACE_SIMILARITY_THRESHOLD", "0.65")
    )
    MAX_CANDIDATES: int = int(os.getenv("MAX_CANDIDATES", "20"))
    PERSIST_UPLOADS: bool = os.getenv("PERSIST_UPLOADS", "false").lower() == "true"
    UPLOAD_DIR: Path = Path(os.getenv("UPLOAD_DIR", "./tmp_uploads"))

    @property
    def has_blockchain(self) -> bool:
        return bool(self.WALLET_PRIVATE_KEY and self.EVIDENCE_REGISTRY_ADDRESS)

    @property
    def blockchain_mode(self) -> str:
        return "PUBLIC_TESTNET" if self.has_blockchain else "LOCAL_DEMO_CHAIN"

    @property
    def active_search_provider(self) -> str:
        if self.SERPAPI_KEY:
            return "serpapi"
        if self.BING_API_KEY:
            return "bing"
        if self.GOOGLE_SEARCH_API_KEY:
            return "google"
        return "demo_fallback"


settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
