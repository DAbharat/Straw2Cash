"""
Pydantic schemas for Demand and Price Insights.
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class BuyerDemandSegment(BaseModel):
    buyer_type: str = Field(..., description="Industry type (BIOMASS_POWER_PLANT, BRICK_KILN, PAPER_MILL, CATTLE_FEED_MAKER)")
    total_demand_tonnes: float
    percentage_of_total: float
    active_buyers_count: int
    indicative_price_range_inr: str


class DemandInsightsResponse(BaseModel):
    region: str
    radius_km: float
    total_buyer_demand_tonnes: float
    available_residue_supply_tonnes: float
    demand_to_supply_ratio: float
    unfulfilled_demand_tonnes: float
    demand_by_buyer_type: List[BuyerDemandSegment]
    source_status: str = Field(
        ..., 
        description="'LIVE_SERVICES' if connected to Go/Java backends, or 'SIMULATED_DEMO_FIXTURE' with clear labelling"
    )
    generated_at: str
    notes: str = Field(
        default="Aggregated from buyer requirements and marketplace listings. "
                "Final commercial commitments require confirmed contracts in Java Rules Service."
    )


class BuyerTypePricingSummary(BaseModel):
    buyer_type: str
    base_rate_inr_per_tonne: float
    transport_rate_inr_per_km_tonne: float
    moisture_threshold_pct: float
    moisture_penalty_inr_per_pct: float
    grade_a_adjustment_inr: float
    grade_b_adjustment_inr: float
    grade_c_adjustment_inr: float
    typical_net_to_farmer_inr_per_tonne: float
    best_suited_for: str


class PriceInsightsResponse(BaseModel):
    currency: str = "INR"
    pricing_authority: str = "Java rules-service (Straw2Cash Price Rules v1)"
    buyer_categories: List[BuyerTypePricingSummary]
    key_rule_notice: str = (
        "In Straw2Cash, transport costs are paid by the buyer and NOT deducted from the farmer's earnings. "
        "The farmer's net income per tonne is base_rate - moisture_penalty + grade_adjustment."
    )
    authoritative_disclaimer: str = (
        "These are indicative rate structures. Authoritative binding quotes must be requested "
        "via Member 2's Java Rules Service POST /api/v1/pricing/quote."
    )
    source_status: str
    generated_at: str
