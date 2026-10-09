"""
Pydantic schemas for Crop Residue Estimation.
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class AreaUnit(str, Enum):
    ACRES = "acres"
    HECTARES = "hectares"
    KILLA = "killa"      # 1 Killa = 1 Acre (Standard in Punjab & Haryana)
    BIGHA = "bigha"      # 1 Bigha ≈ 0.40 Acres = 0.161987 Hectares (Standard North India)
    SQ_METERS = "sq_meters"


class CropType(str, Enum):
    PADDY_RICE = "paddy/rice"
    WHEAT = "wheat"
    SUGARCANE = "sugarcane"
    MAIZE = "maize"


class ResidueEstimateRequest(BaseModel):
    area: float = Field(..., gt=0, description="Field area strictly greater than 0")
    area_unit: AreaUnit = Field(default=AreaUnit.ACRES, description="Unit of measurement for the area")
    crop_type: CropType = Field(default=CropType.PADDY_RICE, description="Type of crop cultivated")
    region: Optional[str] = Field(default="Punjab", description="Geographic region/state (e.g., Punjab, Haryana)")
    
    # Optional farmer or regional overrides (scientifically validated defaults applied if omitted)
    crop_yield_tonnes_per_ha: Optional[float] = Field(
        default=None, 
        gt=0, 
        le=15.0, 
        description="Grain yield in tonnes per hectare. Default derived from regional agricultural statistics."
    )
    residue_to_product_ratio: Optional[float] = Field(
        default=None, 
        gt=0.1, 
        le=3.0, 
        description="Ratio of crop residue biomass to harvested crop grain (RPR)."
    )
    collection_efficiency: Optional[float] = Field(
        default=None, 
        gt=0.1, 
        le=1.0, 
        description="Fraction of gross residue mechanically recoverable by balers/rakes (typically 0.75 - 0.85)."
    )
    moisture_percentage: Optional[float] = Field(
        default=None, 
        ge=5.0, 
        le=50.0, 
        description="Current measured field moisture percentage of straw (standard market baseline is ~14%)."
    )

    @field_validator("area")
    @classmethod
    def validate_positive_area(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Field area must be strictly greater than 0.")
        return v


class ConfidenceRange(BaseModel):
    min_recoverable_tonnes: float = Field(..., description="Conservative lower-bound estimate (-12%)")
    max_recoverable_tonnes: float = Field(..., description="Optimistic upper-bound estimate (+12%)")
    confidence_level_pct: float = Field(default=90.0, description="Confidence interval percentage")
    basis: str = Field(..., description="Methodology behind the uncertainty band")


class AssumptionMetadata(BaseModel):
    grain_yield_assumed_t_per_ha: float
    rpr_assumed: float
    collection_efficiency_assumed: float
    field_moisture_pct: float
    source_citations: list[str]
    notes: str


class InputSummary(BaseModel):
    submitted_area: float
    submitted_unit: str
    normalized_area_hectares: float
    crop_type: str
    region: str


class ResidueEstimateResponse(BaseModel):
    input_summary: InputSummary
    gross_residue_tonnes: float = Field(..., description="Total unharvested biomass produced in field")
    recoverable_residue_tonnes: float = Field(..., description="Saleable straw collectable by balers at field moisture")
    moisture_adjusted_recoverable_tonnes: float = Field(
        ..., 
        description="Standardized dry-basis straw weight adjusted to trade benchmark (~14% moisture)"
    )
    estimated_bales: int = Field(..., description="Approximate number of standard 450kg commercial bales")
    unit: str = "metric tonnes"
    confidence_range: ConfidenceRange
    assumptions: AssumptionMetadata
    disclaimer: str = Field(
        default="This is an algorithmic agronomic estimate based on regional crop-residue coefficients, "
                "not a physical weighing-bridge measurement. Actual baled output may vary based on combine harvester "
                "cutting height, field topography, baler rake efficiency, and weather conditions."
    )
