"""
Unit tests for Multilingual AI Assistant and Strands Agent tools.
"""

import pytest
from app.schemas.assistant import AssistantChatRequest
from app.services.assistant_service import AssistantService, detect_language, extract_area_and_unit
from app.agents.tools import (
    estimate_residue,
    get_nearby_hotspots,
    get_buyer_demand,
    get_indicative_market_prices,
    explain_listing_steps,
)


def test_language_detection():
    """Detects Gurmukhi (Punjabi), Devanagari (Hindi), and English accurately."""
    assert detect_language("5 ਏਕੜ ਵਿੱਚ ਕਿੰਨੀ ਪਰਾਲੀ ਹੋਵੇਗੀ?", "auto") == "pa"
    assert detect_language("5 एकड़ में कितनी पराली निकलेगी?", "auto") == "hi"
    assert detect_language("How much straw will 5 acres produce?", "auto") == "en"
    assert detect_language("Any text", "pa") == "pa"  # Explicit preference respected


def test_area_and_unit_extraction():
    """Extracts numeric values and units from natural text."""
    area, unit = extract_area_and_unit("ਮੇਰੇ ਕੋਲ 8 ਕਿੱਲੇ ਝੋਨਾ ਹੈ")
    assert area == 8.0
    assert unit == "killa"

    area_hi, unit_hi = extract_area_and_unit("12.5 हेक्टेयर खेत")
    assert area_hi == 12.5
    assert unit_hi == "hectares"


def test_agent_tools_execution():
    """Agent tools execute successfully and return structured output."""
    res = estimate_residue(area=4.0, area_unit="acres")
    assert res["status"] == "SUCCESS"
    assert res["recoverable_tonnes"] > 0
    assert res["estimated_bales"] > 0

    hotspots = get_nearby_hotspots(latitude=30.24, longitude=75.84, radius_km=20.0)
    assert hotspots["status"] == "SUCCESS"

    demand = get_buyer_demand(region="Punjab")
    assert demand["status"] == "SUCCESS"
    assert len(demand["key_buyers"]) >= 3

    prices = get_indicative_market_prices("BIOMASS_POWER_PLANT")
    assert prices["status"] == "SUCCESS"
    assert prices["base_rate_inr_per_tonne"] == 2500.0

    steps = explain_listing_steps("pa")
    assert steps["status"] == "SUCCESS"
    assert "Straw2Cash" in steps["steps_text"]


@pytest.mark.asyncio
async def test_assistant_chat_punjabi_residue_query():
    """Punjabi query about residue returns Punjabi response with tool summary."""
    req = AssistantChatRequest(
        message="5 ਏਕੜ ਝੋਨੇ ਵਿੱਚੋਂ ਕਿੰਨੀ ਪਰਾਲੀ ਮਿਲੇਗੀ?",
        language="pa",
        session_id="test-session-pa"
    )
    resp = await AssistantService.chat(req)

    assert resp.detected_language == "pa"
    assert resp.session_id == "test-session-pa"
    assert len(resp.tools_called) > 0
    assert resp.tools_called[0].tool_name == "estimate_residue"
    assert "ਗੱਠਾਂ" in resp.reply or "ਟਨ" in resp.reply
    assert resp.structured_data is not None


@pytest.mark.asyncio
async def test_assistant_chat_hindi_pricing_query():
    """Hindi query about prices returns Hindi response."""
    req = AssistantChatRequest(
        message="पराली का क्या भाव मिलेगा और गाड़ी का भाड़ा कौन देगा?",
        language="hi",
        session_id="test-session-hi"
    )
    resp = await AssistantService.chat(req)

    assert resp.detected_language == "hi"
    assert "2,500" in resp.reply or "3,000" in resp.reply
    assert "भाड़ा" in resp.reply or "खरीदार" in resp.reply


@pytest.mark.asyncio
async def test_assistant_session_isolation():
    """Independent sessions remain isolated."""
    req1 = AssistantChatRequest(message="Hello from user 1", session_id="user-1")
    req2 = AssistantChatRequest(message="Hello from user 2", session_id="user-2")

    resp1 = await AssistantService.chat(req1)
    resp2 = await AssistantService.chat(req2)

    assert resp1.session_id == "user-1"
    assert resp2.session_id == "user-2"
