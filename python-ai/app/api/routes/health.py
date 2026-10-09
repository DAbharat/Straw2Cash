"""
Health and Diagnostic API Route.
"""

from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings
from app.services.marketplace_client import marketplace_client
from app.services.firms_client import firms_client

router = APIRouter(tags=["Health & Status"])


@router.get("/health", summary="Service health status")
async def health_check():
    go_live = await marketplace_client.check_go_backend_health()
    java_live = await marketplace_client.check_java_backend_health()

    firms_key_configured = bool(settings.FIRMS_MAP_KEY and not settings.FIRMS_MAP_KEY.startswith("YOUR_"))

    return {
        "status": "UP",
        "service": "python-ai",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ai_engine": {
            "framework": "strands-agents (v1.59)",
            "provider": settings.MODEL_PROVIDER,
            "bedrock_model_id": settings.BEDROCK_MODEL_ID,
            "bedrock_region": settings.BEDROCK_REGION,
            "ollama_endpoint": settings.OLLAMA_BASE_URL
        },
        "integrations": {
            "nasa_firms": {
                "status": "LIVE" if firms_key_configured else "FIXTURE_MODE",
                "map_key_configured": firms_key_configured,
                "default_sensor": settings.FIRMS_DEFAULT_SOURCE
            },
            "go_backend": {
                "url": settings.GO_BACKEND_URL,
                "reachable": go_live
            },
            "java_rules_service": {
                "url": settings.JAVA_BACKEND_URL,
                "reachable": java_live
            }
        }
    }
