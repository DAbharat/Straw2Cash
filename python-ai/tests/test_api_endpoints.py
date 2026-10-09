"""
Integration tests for FastAPI endpoints using TestClient.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "UP"
    assert data["service"] == "python-ai"
    assert "integrations" in data


def test_residue_estimate_api():
    payload = {
        "area": 4.0,
        "area_unit": "acres",
        "crop_type": "paddy/rice",
        "region": "Punjab"
    }
    resp = client.post("/api/v1/residue/estimate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["gross_residue_tonnes"] > 0
    assert data["recoverable_residue_tonnes"] > 0
    assert data["estimated_bales"] > 0
    assert "disclaimer" in data


def test_residue_estimate_api_validation_error():
    payload = {
        "area": -2.0,
        "area_unit": "acres"
    }
    resp = client.post("/api/v1/residue/estimate", json=payload)
    assert resp.status_code == 422  # Pydantic validation error


def test_hotspots_api():
    resp = client.get("/api/v1/hotspots?days=2")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_hotspots_summary_api():
    resp = client.get("/api/v1/hotspots/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_hotspots" in data
    assert "average_frp_mw" in data


def test_burn_risk_zones_geojson_api():
    resp = client.get("/api/v1/hotspots/risk-zones")
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert "features" in data
    assert len(data["features"]) > 0
    feature = data["features"][0]
    assert feature["geometry"]["type"] == "Point"
    assert "risk_score" in feature["properties"]


def test_assistant_chat_api():
    payload = {
        "message": "ਕੀ ਤੁਸੀਂ ਝੋਨੇ ਦੀ ਪਰਾਲੀ ਦਾ ਰੇਟ ਦੱਸ ਸਕਦੇ ਹੋ?",
        "language": "pa"
    }
    resp = client.post("/api/v1/assistant/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert data["detected_language"] == "pa"
    assert "session_id" in data


def test_demand_insights_api():
    resp = client.get("/api/v1/insights/demand?region=Punjab&radius_km=50")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_buyer_demand_tonnes"] > 0
    assert data["demand_to_supply_ratio"] > 0


def test_price_insights_api():
    resp = client.get("/api/v1/insights/prices")
    assert resp.status_code == 200
    data = resp.json()
    assert data["currency"] == "INR"
    assert len(data["buyer_categories"]) == 4


def test_demo_page_loads():
    resp = client.get("/demo")
    assert resp.status_code == 200
    assert "Straw2Cash" in resp.text
