"""
Main FastAPI application entry point for Straw2Cash Python AI/ML Service.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from app.core.config import settings
from app.core.logging import logger
from app.api.routes import health, residue, hotspots, assistant, insights

app = FastAPI(
    title="Straw2Cash Python AI/ML Service",
    description="Scientific crop residue estimation, NASA FIRMS satellite fire-hotspot intelligence, "
                "multilingual Strands Agents farmer assistant (Hindi/Punjabi/English), and demand/price insights.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 Routers
api_v1_prefix = settings.API_V1_PREFIX
app.include_router(health.router, prefix=api_v1_prefix)
app.include_router(residue.router, prefix=api_v1_prefix)
app.include_router(hotspots.router, prefix=api_v1_prefix)
app.include_router(assistant.router, prefix=api_v1_prefix)
app.include_router(insights.router, prefix=api_v1_prefix)


@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "Straw2Cash Python AI/ML Intelligence Layer",
        "owner": "Member 3",
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health",
        "demo_ui": "/demo",
        "status": "OPERATIONAL"
    }


@app.get("/demo", response_class=HTMLResponse, tags=["Demo"])
async def demo_page():
    """
    Farmer-friendly interactive demo and integration test bench.
    Provides Hindi/Punjabi/English language switching, speech synthesis/recognition hooks,
    quick question chips, Leaflet satellite fire risk map, and live residue calculator.
    """
    import os
    template_path = os.path.join(os.path.dirname(__file__), "templates", "demo.html")
    if os.path.exists(template_path):
        with open(template_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(content="<h1>Straw2Cash Demo UI: Template file not found.</h1>", status_code=404)
