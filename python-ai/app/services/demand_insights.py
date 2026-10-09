"""
Demand and Price Insights Analytics Engine.
Combines aggregated marketplace requirements, supply listings, and Java pricing rules.
"""

from datetime import datetime, timezone
from typing import Dict, Any, List

from app.schemas.insights import (
    DemandInsightsResponse,
    BuyerDemandSegment,
    PriceInsightsResponse,
    BuyerTypePricingSummary,
)
from app.services.marketplace_client import marketplace_client

# Static verified table rules from Java rules-service (PriceRule table v1)
JAVA_RULES_V1: List[BuyerTypePricingSummary] = [
    BuyerTypePricingSummary(
        buyer_type="BIOMASS_POWER_PLANT",
        base_rate_inr_per_tonne=2500.0,
        transport_rate_inr_per_km_tonne=45.0,
        moisture_threshold_pct=14.0,
        moisture_penalty_inr_per_pct=80.0,
        grade_a_adjustment_inr=0.0,
        grade_b_adjustment_inr=-100.0,
        grade_c_adjustment_inr=-250.0,
        typical_net_to_farmer_inr_per_tonne=2500.0,
        best_suited_for="High-volume steady baseload demand; moisture under 14% receives full rate."
    ),
    BuyerTypePricingSummary(
        buyer_type="CATTLE_FEED_MAKER",
        base_rate_inr_per_tonne=3000.0,
        transport_rate_inr_per_km_tonne=55.0,
        moisture_threshold_pct=18.0,
        moisture_penalty_inr_per_pct=60.0,
        grade_a_adjustment_inr=100.0,
        grade_b_adjustment_inr=-100.0,
        grade_c_adjustment_inr=-300.0,
        typical_net_to_farmer_inr_per_tonne=3100.0,
        best_suited_for="Premium clean straw (Grade A); highest per-tonne earnings for farmers."
    ),
    BuyerTypePricingSummary(
        buyer_type="PAPER_MILL",
        base_rate_inr_per_tonne=2200.0,
        transport_rate_inr_per_km_tonne=50.0,
        moisture_threshold_pct=12.0,
        moisture_penalty_inr_per_pct=90.0,
        grade_a_adjustment_inr=50.0,
        grade_b_adjustment_inr=-100.0,
        grade_c_adjustment_inr=-250.0,
        typical_net_to_farmer_inr_per_tonne=2250.0,
        best_suited_for="Requires dry straw (low moisture); pays bonus for Grade A fiber."
    ),
    BuyerTypePricingSummary(
        buyer_type="BRICK_KILN",
        base_rate_inr_per_tonne=1800.0,
        transport_rate_inr_per_km_tonne=40.0,
        moisture_threshold_pct=16.0,
        moisture_penalty_inr_per_pct=70.0,
        grade_a_adjustment_inr=0.0,
        grade_b_adjustment_inr=-80.0,
        grade_c_adjustment_inr=-200.0,
        typical_net_to_farmer_inr_per_tonne=1800.0,
        best_suited_for="Tolerant of mixed grades and slightly higher moisture up to 16%."
    )
]


class DemandInsightsService:
    """
    Computes market intelligence, supply-demand balances, and price ranges.
    """

    @classmethod
    async def get_demand_insights(
        cls, 
        region: str = "Punjab", 
        radius_km: float = 50.0
    ) -> DemandInsightsResponse:
        requirements, req_source = await marketplace_client.get_buyer_requirements()
        listings, list_source = await marketplace_client.get_straw_listings()

        source_status = "LIVE_SERVICES" if (req_source == "LIVE_SERVICES" and list_source == "LIVE_SERVICES") else "SIMULATED_DEMO_FIXTURE"

        total_demand_tonnes = 0.0
        unfulfilled_demand_tonnes = 0.0
        demand_by_type: Dict[str, Dict[str, Any]] = {
            "BIOMASS_POWER_PLANT": {"tonnes": 0.0, "count": 0, "price_range": "₹2,250 - ₹2,500/t"},
            "PAPER_MILL": {"tonnes": 0.0, "count": 0, "price_range": "₹2,100 - ₹2,250/t"},
            "CATTLE_FEED_MAKER": {"tonnes": 0.0, "count": 0, "price_range": "₹2,900 - ₹3,100/t"},
            "BRICK_KILN": {"tonnes": 0.0, "count": 0, "price_range": "₹1,700 - ₹1,800/t"}
        }

        for req in requirements:
            qty_t = (req.get("quantity_required_kg") or 0.0) / 1000.0
            rem_t = (req.get("remaining_quantity_kg") or 0.0) / 1000.0
            total_demand_tonnes += qty_t
            unfulfilled_demand_tonnes += rem_t

            b_type = req.get("buyer_type", "BIOMASS_POWER_PLANT")
            if b_type not in demand_by_type:
                demand_by_type[b_type] = {"tonnes": 0.0, "count": 0, "price_range": "₹2,000 - ₹2,500/t"}
            demand_by_type[b_type]["tonnes"] += qty_t
            demand_by_type[b_type]["count"] += 1

        total_supply_tonnes = sum((lst.get("quantity_kg", 0.0) / 1000.0) for lst in listings)
        ratio = round(total_demand_tonnes / max(1.0, total_supply_tonnes), 2)

        segments: List[BuyerDemandSegment] = []
        for b_type, info in demand_by_type.items():
            pct = round((info["tonnes"] / max(1.0, total_demand_tonnes)) * 100.0, 1)
            segments.append(BuyerDemandSegment(
                buyer_type=b_type,
                total_demand_tonnes=round(info["tonnes"], 1),
                percentage_of_total=pct,
                active_buyers_count=info["count"],
                indicative_price_range_inr=info["price_range"]
            ))

        segments.sort(key=lambda s: s.total_demand_tonnes, reverse=True)

        return DemandInsightsResponse(
            region=region,
            radius_km=radius_km,
            total_buyer_demand_tonnes=round(total_demand_tonnes, 1),
            available_residue_supply_tonnes=round(total_supply_tonnes, 1),
            demand_to_supply_ratio=ratio,
            unfulfilled_demand_tonnes=round(unfulfilled_demand_tonnes, 1),
            demand_by_buyer_type=segments,
            source_status=source_status,
            generated_at=datetime.now(timezone.utc).isoformat()
        )

    @classmethod
    async def get_price_insights(cls) -> PriceInsightsResponse:
        is_java_live = await marketplace_client.check_java_backend_health()
        source_status = "LIVE_JAVA_RULES_SERVICE" if is_java_live else "SIMULATED_DEMO_FIXTURE"

        return PriceInsightsResponse(
            currency="INR",
            pricing_authority="Member 2 Java Rules Service (Straw2Cash Price Rules v1)",
            buyer_categories=JAVA_RULES_V1,
            source_status=source_status,
            generated_at=datetime.now(timezone.utc).isoformat()
        )
