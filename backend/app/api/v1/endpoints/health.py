from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0",
        "features": {
            "multi_tenancy": True,
            "vector_store": "pgvector",
            "ai_engine": "gemini",
            "vision_engine": "opencv_deterministic",
        }
    }

