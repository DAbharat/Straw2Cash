"""
HTTP client for communicating with Member 1's Go backend and Member 2's Java rules service.
Provides non-blocking async queries, circuit-breaking timeouts, and explicitly tagged fallback fixtures.
"""

from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple, Optional
import httpx

from app.core.config import settings
from app.core.logging import logger

# Deterministic simulated fixtures matching Go internal/dto/requirement_dto.go and listing_dto.go
SIMULATED_BUYER_REQUIREMENTS: List[Dict[str, Any]] = [
    {
        "id": "REQ-001",
        "buyer_id": "B021",
        "buyer_name": "Malwa Bio-Energy Ltd (Biomass Power Plant)",
        "buyer_type": "BIOMASS_POWER_PLANT",
        "crop_type": "paddy/rice",
        "quantity_required_kg": 450000.0,  # 450 tonnes
        "remaining_quantity_kg": 280000.0, # 280 tonnes unfulfilled
        "max_price_per_kg": 2.50,
        "preferred_radius_km": 50.0,
        "location": "Sangrur, Punjab",
        "required_from": "2026-10-01",
        "required_until": "2026-11-30",
        "status": "OPEN"
    },
    {
        "id": "REQ-002",
        "buyer_id": "B034",
        "buyer_name": "Shree Ganesh Paper Mill",
        "buyer_type": "PAPER_MILL",
        "crop_type": "paddy/rice",
        "quantity_required_kg": 200000.0,  # 200 tonnes
        "remaining_quantity_kg": 150000.0, # 150 tonnes unfulfilled
        "max_price_per_kg": 2.30,
        "preferred_radius_km": 60.0,
        "location": "Barnala, Punjab",
        "required_from": "2026-10-05",
        "required_until": "2026-12-15",
        "status": "OPEN"
    },
    {
        "id": "REQ-003",
        "buyer_id": "B012",
        "buyer_name": "Kisan Fodder & Cattle Feed Cooperative",
        "buyer_type": "CATTLE_FEED_MAKER",
        "crop_type": "paddy/rice",
        "quantity_required_kg": 120000.0,  # 120 tonnes
        "remaining_quantity_kg": 60000.0,  # 60 tonnes unfulfilled
        "max_price_per_kg": 3.00,
        "preferred_radius_km": 35.0,
        "location": "Patiala, Punjab",
        "required_from": "2026-10-10",
        "required_until": "2026-11-25",
        "status": "PARTIALLY_FULFILLED"
    },
    {
        "id": "REQ-004",
        "buyer_id": "B008",
        "buyer_name": "Punjab Brick Kiln Association Unit 4",
        "buyer_type": "BRICK_KILN",
        "crop_type": "paddy/rice",
        "quantity_required_kg": 80000.0,   # 80 tonnes
        "remaining_quantity_kg": 50000.0,  # 50 tonnes unfulfilled
        "max_price_per_kg": 1.85,
        "preferred_radius_km": 25.0,
        "location": "Ludhiana, Punjab",
        "required_from": "2026-10-08",
        "required_until": "2026-11-20",
        "status": "OPEN"
    }
]

SIMULATED_STRAW_LISTINGS: List[Dict[str, Any]] = [
    {
        "id": "LST-101",
        "farmer_id": "F001",
        "farmer_name": "Gurpreet Singh",
        "crop_type": "paddy/rice",
        "quantity_kg": 32000.0,  # 32 tonnes
        "price_per_kg": 2.50,
        "moisture_percentage": 13.0,
        "pickup_latitude": 30.2458,
        "pickup_longitude": 75.8421,
        "status": "AVAILABLE"
    },
    {
        "id": "LST-102",
        "farmer_id": "F002",
        "farmer_name": "Harjit Kaur",
        "crop_type": "paddy/rice",
        "quantity_kg": 24000.0,  # 24 tonnes
        "price_per_kg": 2.40,
        "moisture_percentage": 14.5,
        "pickup_latitude": 30.2512,
        "pickup_longitude": 75.8490,
        "status": "AVAILABLE"
    },
    {
        "id": "LST-103",
        "farmer_id": "F003",
        "farmer_name": "Balwinder Singh",
        "crop_type": "paddy/rice",
        "quantity_kg": 40000.0,  # 40 tonnes
        "price_per_kg": 2.50,
        "moisture_percentage": 12.0,
        "pickup_latitude": 30.3400,
        "pickup_longitude": 76.3800,
        "status": "MATCHED"
    }
]


class MarketplaceClient:
    """
    Communicates with Go and Java backends to aggregate marketplace demand and pricing.
    """

    async def check_go_backend_health(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=1.5) as client:
                resp = await client.get(f"{settings.GO_BACKEND_URL}/health")
                return resp.status_code == 200
        except Exception:
            return False

    async def check_java_backend_health(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=1.5) as client:
                resp = await client.get(f"{settings.JAVA_BACKEND_URL}/api/v1/health")
                return resp.status_code == 200
        except Exception:
            return False

    async def get_buyer_requirements(self) -> Tuple[List[Dict[str, Any]], str]:
        """
        Fetches buyer requirements from Go service or falls back to simulated fixtures.
        Returns: (requirements_list, source_status)
        """
        try:
            async with httpx.AsyncClient(timeout=settings.UPSTREAM_TIMEOUT_SECONDS) as client:
                resp = await client.get(f"{settings.GO_BACKEND_URL}/api/v1/requirements")
                if resp.status_code == 200:
                    data = resp.json()
                    logger.info(f"Received {len(data)} buyer requirements from Go service")
                    return data, "LIVE_SERVICES"
        except Exception as ex:
            logger.debug(f"Go service unavailable: {ex}. Using simulated buyer requirements.")

        return SIMULATED_BUYER_REQUIREMENTS, "SIMULATED_DEMO_FIXTURE"

    async def get_straw_listings(self) -> Tuple[List[Dict[str, Any]], str]:
        """
        Fetches straw listings from Go service or falls back to simulated fixtures.
        """
        try:
            async with httpx.AsyncClient(timeout=settings.UPSTREAM_TIMEOUT_SECONDS) as client:
                resp = await client.get(f"{settings.GO_BACKEND_URL}/api/v1/listings")
                if resp.status_code == 200:
                    data = resp.json()
                    return data, "LIVE_SERVICES"
        except Exception as ex:
            logger.debug(f"Go service unavailable: {ex}. Using simulated straw listings.")

        return SIMULATED_STRAW_LISTINGS, "SIMULATED_DEMO_FIXTURE"


marketplace_client = MarketplaceClient()
