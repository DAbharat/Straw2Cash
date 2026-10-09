"""
Unit tests for NASA FIRMS satellite intelligence and Potential Burn-Risk scoring.
"""

import pytest
from app.schemas.hotspot import HotspotQueryFilter, HotspotDetection
from app.services.firms_client import NasaFirmsClient
from app.services.burn_risk import BurnRiskAnalyzer, haversine_distance_km


@pytest.mark.asyncio
async def test_firms_deterministic_fixture_fallback():
    """Client returns Punjab/Haryana fixtures when FIRMS_MAP_KEY is absent."""
    client = NasaFirmsClient()
    query = HotspotQueryFilter(min_lat=29.5, min_lon=74.0, max_lat=32.5, max_lon=77.0, day_range=2)

    detections, source, cached = await client.fetch_hotspots(query, map_key=None)

    assert len(detections) > 0
    assert source == "DETERMINISTIC_FIXTURE_FALLBACK"
    assert cached is False

    # Check that detections are valid HotspotDetection objects
    first = detections[0]
    assert 29.5 <= first.latitude <= 32.5
    assert 74.0 <= first.longitude <= 77.0
    assert first.instrument == "VIIRS"
    assert first.frp is not None


@pytest.mark.asyncio
async def test_firms_caching_behavior():
    """Identical query within TTL returns cached result."""
    client = NasaFirmsClient()
    query = HotspotQueryFilter(min_lat=30.0, min_lon=75.0, max_lat=31.0, max_lon=76.0)

    # 1st call
    _, _, cached1 = await client.fetch_hotspots(query)
    assert cached1 is False

    # 2nd call
    _, _, cached2 = await client.fetch_hotspots(query)
    assert cached2 is True


def test_firms_csv_parser():
    """Test parser handles NASA FIRMS CSV format."""
    client = NasaFirmsClient()
    sample_csv = (
        "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight\n"
        "30.25,75.85,340.2,0.4,0.4,2026-10-09,0815,NOAA-20,VIIRS,high,2.0NRT,298.0,15.5,D\n"
        "31.10,76.20,320.0,0.5,0.4,2026-10-09,0816,NOAA-20,VIIRS,nominal,2.0NRT,290.0,8.2,D\n"
    )
    detections = client._parse_firms_csv(sample_csv, "VIIRS_NOAA20_NRT")
    assert len(detections) == 2
    assert detections[0].latitude == 30.25
    assert detections[0].frp == 15.5
    assert detections[0].confidence == "high"


def test_burn_risk_analyzer_scoring():
    """Risk zones cluster nearby points and produce explainable multi-factor scores."""
    hotspots = [
        HotspotDetection(
            latitude=30.245, longitude=75.842, brightness=340.0,
            acq_date="2026-10-09", acq_time="0800", satellite="NOAA-20",
            confidence="high", frp=22.0
        ),
        HotspotDetection(
            latitude=30.249, longitude=75.846, brightness=342.0,
            acq_date="2026-10-09", acq_time="0800", satellite="NOAA-20",
            confidence="high", frp=19.5
        ),
        # Distant hotspot (>50km away)
        HotspotDetection(
            latitude=31.100, longitude=76.800, brightness=310.0,
            acq_date="2026-10-09", acq_time="0800", satellite="NOAA-21",
            confidence="low", frp=5.0
        )
    ]

    geojson = BurnRiskAnalyzer.analyze_zones(hotspots, cluster_radius_km=7.5)

    assert geojson.type == "FeatureCollection"
    assert len(geojson.features) == 2  # Two distinct clusters

    cluster_1 = geojson.features[0]
    props = cluster_1.properties
    assert props.hotspot_count == 2
    assert props.risk_score > 0
    assert props.risk_level in ["MEDIUM", "HIGH", "CRITICAL"]
    assert len(props.evidence_breakdown) == 4
    assert "Potential Agricultural Burn-Risk Zone" in props.classification_caveat

    # Verify GeoJSON coordinates format: [longitude, latitude]
    coords = cluster_1.geometry.coordinates
    assert len(coords) == 2
    assert 75.0 <= coords[0] <= 77.0  # lon
    assert 30.0 <= coords[1] <= 32.0  # lat


def test_haversine_distance():
    """Test haversine distance calculation."""
    # Sangrur to Patiala is approximately ~55-60 km
    dist = haversine_distance_km(30.2458, 75.8421, 30.3400, 76.3800)
    assert 50.0 < dist < 65.0
