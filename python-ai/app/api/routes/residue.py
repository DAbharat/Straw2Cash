"""
API route for crop residue estimation.
"""

from fastapi import APIRouter, HTTPException, status
from app.schemas.residue import ResidueEstimateRequest, ResidueEstimateResponse
from app.services.residue_estimator import ResidueEstimatorService
from app.core.logging import logger

router = APIRouter(prefix="/residue", tags=["Residue Estimation"])


@router.post(
    "/estimate",
    response_model=ResidueEstimateResponse,
    status_code=status.HTTP_200_OK,
    summary="Estimate crop residue biomass and recoverable straw",
    description="Calculates gross and recoverable crop residue based on field area, crop type, "
                "and scientific agronomic coefficients (ICAR / PAU / TIFAC)."
)
async def estimate_residue(request: ResidueEstimateRequest) -> ResidueEstimateResponse:
    try:
        response = ResidueEstimatorService.estimate(request)
        logger.info(
            f"Residue estimated: {request.area} {request.area_unit.value} -> "
            f"{response.recoverable_residue_tonnes} recoverable tonnes ({response.estimated_bales} bales)"
        )
        return response
    except Exception as ex:
        logger.error(f"Error calculating residue estimate: {str(ex)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Residue calculation error: {str(ex)}"
        )
