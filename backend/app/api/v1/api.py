from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, brands, facts, rules, audit, reviews

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(brands.router, prefix="/brands", tags=["Brand Workspaces"])
api_router.include_router(facts.router, prefix="/brands", tags=["Golden Facts"])
api_router.include_router(rules.router, prefix="/brands", tags=["Brand Rules & Guardrails"])
api_router.include_router(audit.router, prefix="/brands", tags=["AI Governance Audit"])
api_router.include_router(reviews.router, prefix="/brands", tags=["Human Review Queue"])

