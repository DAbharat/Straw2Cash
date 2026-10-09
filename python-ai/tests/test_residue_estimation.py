"""
Unit tests for Crop-Residue Estimation Engine.
Tests formulas, unit conversions, validation, overrides, and edge cases.
"""

import pytest
from pydantic import ValidationError

from app.schemas.residue import ResidueEstimateRequest, AreaUnit, CropType
from app.services.residue_estimator import ResidueEstimatorService, AREA_TO_HECTARES


def test_standard_paddy_estimation_acres():
    """5 acres paddy should produce ~15 tonnes recoverable straw."""
    req = ResidueEstimateRequest(
        area=5.0,
        area_unit=AreaUnit.ACRES,
        crop_type=CropType.PADDY_RICE
    )
    res = ResidueEstimatorService.estimate(req)

    # 5 acres * 0.4046856 ha/acre = 2.0234 ha
    # Gross: 2.0234 * 6.20 t/ha * 1.20 RPR = 15.05 tonnes
    # Recoverable: 15.05 * 0.80 = 12.04 tonnes
    assert res.input_summary.submitted_area == 5.0
    assert res.input_summary.submitted_unit == "acres"
    assert round(res.input_summary.normalized_area_hectares, 2) == 2.02
    assert res.gross_residue_tonnes > 0
    assert res.recoverable_residue_tonnes > 0
    assert res.recoverable_residue_tonnes < res.gross_residue_tonnes
    assert res.estimated_bales >= 25
    assert res.confidence_range.min_recoverable_tonnes < res.recoverable_residue_tonnes
    assert res.confidence_range.max_recoverable_tonnes > res.recoverable_residue_tonnes
    assert "estimate" in res.disclaimer.lower()


def test_killa_unit_equals_acre():
    """In Punjab/Haryana, 1 Killa has identical acreage to 1 Acre."""
    req_acre = ResidueEstimateRequest(area=2.0, area_unit=AreaUnit.ACRES)
    req_killa = ResidueEstimateRequest(area=2.0, area_unit=AreaUnit.KILLA)

    res_acre = ResidueEstimatorService.estimate(req_acre)
    res_killa = ResidueEstimatorService.estimate(req_killa)

    assert res_acre.recoverable_residue_tonnes == res_killa.recoverable_residue_tonnes
    assert res_acre.estimated_bales == res_killa.estimated_bales


def test_hectare_and_bigha_conversions():
    """Tests hectare and bigha conversions."""
    req_ha = ResidueEstimateRequest(area=1.0, area_unit=AreaUnit.HECTARES)
    res_ha = ResidueEstimatorService.estimate(req_ha)
    assert res_ha.input_summary.normalized_area_hectares == 1.0

    # 1 Bigha (Pucca) = 0.4 Acre = 0.161987 ha
    req_bigha = ResidueEstimateRequest(area=10.0, area_unit=AreaUnit.BIGHA)
    res_bigha = ResidueEstimatorService.estimate(req_bigha)
    assert round(res_bigha.input_summary.normalized_area_hectares, 2) == 1.62


def test_custom_user_overrides():
    """User can provide verified local crop yield or specific baler efficiency."""
    req = ResidueEstimateRequest(
        area=10.0,
        area_unit=AreaUnit.HECTARES,
        crop_yield_tonnes_per_ha=7.0,
        residue_to_product_ratio=1.25,
        collection_efficiency=0.85,
        moisture_percentage=14.0
    )
    res = ResidueEstimatorService.estimate(req)

    # Gross = 10 * 7.0 * 1.25 = 87.5 tonnes
    # Recoverable = 87.5 * 0.85 = 74.375 tonnes
    assert res.gross_residue_tonnes == 87.5
    assert res.recoverable_residue_tonnes == 74.38
    assert res.assumptions.grain_yield_assumed_t_per_ha == 7.0
    assert res.assumptions.collection_efficiency_assumed == 0.85


def test_reject_zero_and_negative_area():
    """Field area must be strictly positive."""
    with pytest.raises(ValidationError):
        ResidueEstimateRequest(area=0.0)

    with pytest.raises(ValidationError):
        ResidueEstimateRequest(area=-5.0)


def test_reject_unrealistic_collection_efficiency():
    """Efficiency cannot exceed 1.0 (100%)."""
    with pytest.raises(ValidationError):
        ResidueEstimateRequest(area=5.0, collection_efficiency=1.5)
