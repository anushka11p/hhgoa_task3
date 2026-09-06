"""
TRACE // VERIFY — FastAPI Application Entry Point
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.config import settings
from app.api.investigations import router as inv_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="TRACE // VERIFY",
    description="Face Identification & Blockchain Verification Pipeline",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inv_router, prefix="/api/investigation")


@app.get("/api/health")
async def root_health():
    from app.services.face import detector as face_svc
    from app.services.blockchain import adapter as blockchain

    return {
        "status": "ok",
        "service": "TRACE // VERIFY",
        "face_backend": face_svc.get_backend(),
        "blockchain_mode": blockchain.get_mode(),
        "search_provider": settings.active_search_provider,
    }


@app.on_event("startup")
async def startup():
    logger.info("=" * 60)
    logger.info("TRACE // VERIFY  —  Digital Forensics Engine")
    logger.info(f"Blockchain mode: {settings.blockchain_mode}")
    logger.info(f"Search provider: {settings.active_search_provider}")
    logger.info(f"Demo fallback: {settings.DEMO_FALLBACK_ENABLED}")
    logger.info("=" * 60)
