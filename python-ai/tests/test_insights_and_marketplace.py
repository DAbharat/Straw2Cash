"""
Unit tests for Demand & Price Insights and Marketplace Integration.
"""

import pytest
from app.services.demand_insights import DemandInsightsService
from app.services.marketplace_client import marketplace_client


@pytest.mark.asyncio
async def test_demand_insights_aggregation():
    """Demand insights aggregates buyer requirements and computes ratios."""
    insights = await DemandInsightsService.get_demand_insights(region="Punjab", radius_km=50.0)

    assert insights.region == "Punjab"
    assert insights.total_buyer_demand_tonnes > 0
    assert insights.available_residue_supply_tonnes > 0
    assert insights.demand_to_supply_ratio > 0
    assert len(insights.demand_by_buyer_type) >= 3

    # Check buyer categories present
    buyer_types = [s.buyer_type for s in insights.demand_by_buyer_type]
    assert "BIOMASS_POWER_PLANT" in buyer_types
    assert "CATTLE_FEED_MAKER" in buyer_types


@pytest.mark.asyncio
async def test_price_insights_alignment_with_java():
    """Price insights reflects Java rules-service frozen v1 contracts."""
    prices = await DemandInsightsService.get_price_insights()

    assert prices.currency == "INR"
    assert "Java" in prices.pricing_authority
    assert len(prices.buyer_categories) == 4

    # Check Biomass Power Plant rules
    biomass = next(b for b in prices.buyer_categories if b.buyer_type == "BIOMASS_POWER_PLANT")
    assert biomass.base_rate_inr_per_tonne == 2500.0
    assert biomass.moisture_threshold_pct == 14.0
    assert biomass.moisture_penalty_inr_per_pct == 80.0

    # Check Cattle Feed rules
    feed = next(b for b in prices.buyer_categories if b.buyer_type == "CATTLE_FEED_MAKER")
    assert feed.base_rate_inr_per_tonne == 3000.0
    assert feed.grade_a_adjustment_inr == 100.0
