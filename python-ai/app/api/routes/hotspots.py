"""
API routes for NASA FIRMS fire-hotspots and potential burn-risk zones.
"""

from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException, status

from app.schemas.hotspot import (
    HotspotDetection,
    HotspotQueryFilter,
    HotspotSummaryResponse,
    BurnRiskFeatureCollection,
)
from app.services.firms_client import firms_client
from app.services.burn_risk import BurnRiskAnalyzer
from app.core.logging import logger

router = APIRouter(prefix="/hotspots", tags=["Satellite Fire Hotspots & Burn Risk"])


@router.get(
    "",
    response_model=List[HotspotDetection],
    summary="Get normalized satellite fire detections",
    description="Fetches recent fire hotspots from NASA FIRMS VIIRS/MODIS sensors, "
                "with resilient caching and deterministic fallback fixtures."
)
async def get_hotspots(
    min_lat: float = Query(29.5, description="South bounding latitude (Punjab/Haryana core)"),
    min_lon: float = Query(74.0, description="West bounding longitude"),
    max_lat: float = Query(32.5, description="North bounding latitude"),
    max_lon: float = Query(77.0, description="East bounding longitude"),
    days: int = Query(2, ge=1, le=10, description="Lookback window in days (1-10)"),
    source: str = Query("VIIRS_NOAA20_NRT", description="Satellite sensor product"),
    min_confidence: Optional[str] = Query(None, description="Optional filter: 'nominal', 'high'")
) -> List[HotspotDetection]:
    query = HotspotQueryFilter(
        min_lat=min_lat,
        min_lon=min_lon,
        max_lat=max_lat,
        max_lon=max_lon,
        day_range=days,
        satellite_source=source,
        min_confidence=min_confidence
    )
    detections, src, cached = await firms_client.fetch_hotspots(query)
    logger.info(f"Retrieved {len(detections)} hotspots (Source: {src}, Cached: {cached})")
    return detections


@router.get(
    "/summary",
    response_model=HotspotSummaryResponse,
    summary="Get aggregated hotspot statistics",
    description="Provides total detections, high-confidence counts, average FRP, and metadata."
)
async def get_hotspots_summary(
    min_lat: float = Query(29.5),
    min_lon: float = Query(74.0),
    max_lat: float = Query(32.5),
    max_lon: float = Query(77.0),
    days: int = Query(2, ge=1, le=10),
    source: str = Query("VIIRS_NOAA20_NRT")
) -> HotspotSummaryResponse:
    query = HotspotQueryFilter(
        min_lat=min_lat,
        min_lon=min_lon,
        max_lat=max_lat,
        max_lon=max_lon,
        day_range=days,
        satellite_source=source
    )
    return await firms_client.get_summary(query)


@router.get(
    "/risk-zones",
    response_model=BurnRiskFeatureCollection,
    summary="Get potential burn-risk zones in GeoJSON format",
    description="Clusters satellite hotspots and computes transparent heuristic burn-risk scores (0-100) "
                "with explainable multi-factor evidence for map visualization."
)
async def get_burn_risk_zones(
    min_lat: float = Query(29.5),
    min_lon: float = Query(74.0),
    max_lat: float = Query(32.5),
    max_lon: float = Query(77.0),
    days: int = Query(2, ge=1, le=10),
    cluster_radius_km: float = Query(7.5, ge=1.0, le=50.0)
) -> BurnRiskFeatureCollection:
    query = HotspotQueryFilter(
        min_lat=min_lat,
        min_lon=min_lon,
        max_lat=max_lat,
        max_lon=max_lon,
        day_range=days
    )
    detections, _, _ = await firms_client.fetch_hotspots(query)
    zones_geojson = BurnRiskAnalyzer.analyze_zones(
        hotspots=detections,
        cluster_radius_km=cluster_radius_km
    )
    return zones_geojson
