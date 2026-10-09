"""
Pydantic schemas for NASA FIRMS Fire-Hotspots and Burn-Risk Analysis.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class HotspotDetection(BaseModel):
    latitude: float
    longitude: float
    brightness: float = Field(..., description="Brightness temperature (Kelvin)")
    scan: Optional[float] = None
    track: Optional[float] = None
    acq_date: str = Field(..., description="Acquisition date (YYYY-MM-DD)")
    acq_time: str = Field(..., description="Acquisition time (HHMM UTC)")
    satellite: str = Field(..., description="Satellite sensor (e.g., NOAA-20, NOAA-21, Suomi-NPP)")
    instrument: str = Field(default="VIIRS", description="Instrument name (VIIRS or MODIS)")
    confidence: str = Field(..., description="Detection confidence: 'nominal', 'low', 'high', or percentage")
    version: Optional[str] = None
    bright_t31: Optional[float] = None
    frp: Optional[float] = Field(None, description="Fire Radiative Power in Megawatts (MW)")
    daynight: Optional[str] = Field(None, description="'D' for Day, 'N' for Night")


class HotspotQueryFilter(BaseModel):
    min_lat: float = 29.5
    min_lon: float = 74.0
    max_lat: float = 32.5
    max_lon: float = 77.0
    day_range: int = Field(default=2, ge=1, le=10, description="NASA FIRMS supported range (1-10 days)")
    satellite_source: str = "VIIRS_NOAA20_NRT"
    min_confidence: Optional[str] = None


class HotspotSummaryResponse(BaseModel):
    total_hotspots: int
    high_confidence_count: int
    nominal_confidence_count: int
    low_confidence_count: int
    average_frp_mw: float
    date_range_days: int
    satellite_source: str
    bounding_box: Dict[str, float]
    data_source: str = Field(..., description="'NASA_FIRMS_LIVE' or 'DETERMINISTIC_FIXTURE_FALLBACK'")
    cached: bool
    generated_at: str
    disclaimer: str = (
        "Thermal anomalies detected by satellite sensors indicate surface heat sources. "
        "They do not independently confirm crop residue burning without ground-truth verification."
    )


class RiskEvidenceFactor(BaseModel):
    factor_name: str
    weight: float
    score_contribution: float
    detail: str


class BurnRiskZoneProperties(BaseModel):
    zone_id: str
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Heuristic burn risk score from 0 (minimal) to 100 (critical)")
    risk_level: str = Field(..., description="LOW, MEDIUM, HIGH, or CRITICAL")
    cluster_center_lat: float
    cluster_center_lon: float
    hotspot_count: int
    max_frp_mw: float
    recency_hours: float
    proximity_to_unlisted_fields: str
    harvest_season_active: bool
    evidence_breakdown: List[RiskEvidenceFactor]
    assessment_notes: str
    classification_caveat: str = (
        "Classification: Potential Agricultural Burn-Risk Zone. "
        "This is an automated geospatial heuristic and does NOT constitute proof of illegal stubble burning."
    )


class GeoJsonGeometry(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]


class GeoJsonFeature(BaseModel):
    type: str = "Feature"
    geometry: GeoJsonGeometry
    properties: BurnRiskZoneProperties


class BurnRiskFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJsonFeature]
    metadata: Dict[str, Any]
