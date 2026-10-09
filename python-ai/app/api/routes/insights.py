"""
API routes for Demand and Price Insights.
"""

from fastapi import APIRouter, Query, status

from app.schemas.insights import DemandInsightsResponse, PriceInsightsResponse
from app.services.demand_insights import DemandInsightsService

router = APIRouter(prefix="/insights", tags=["Marketplace Insights"])


@router.get(
    "/demand",
    response_model=DemandInsightsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get aggregated buyer demand and supply insights",
    description="Calculates total local demand, available straw supply, demand-supply ratio, "
                "and breakdown across biomass power plants, paper mills, and cattle feed processors."
)
async def get_demand_insights(
    region: str = Query("Punjab", description="Geographic region/district"),
    radius_km: float = Query(50.0, ge=5.0, le=200.0, description="Search radius in kilometers")
) -> DemandInsightsResponse:
    return await DemandInsightsService.get_demand_insights(region=region, radius_km=radius_km)


@router.get(
    "/prices",
    response_model=PriceInsightsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get indicative price structures by buyer industry",
    description="Returns indicative price structures aligned with Member 2's Java Rules Service."
)
async def get_price_insights() -> PriceInsightsResponse:
    return await DemandInsightsService.get_price_insights()
