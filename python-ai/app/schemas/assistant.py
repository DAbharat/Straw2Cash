"""
Pydantic schemas for Farmer Multilingual AI Assistant.
"""

from typing import List, Dict, Optional, Any, Literal
from pydantic import BaseModel, Field


class ToolInvocationSummary(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]
    status: str = "SUCCESS"
    summary: str


class AssistantChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="Farmer message or question")
    language: Literal["en", "hi", "pa", "auto"] = Field(
        default="auto",
        description="Language preference: 'hi' (Hindi), 'pa' (Punjabi), 'en' (English), or 'auto' to detect"
    )
    session_id: Optional[str] = Field(
        default=None,
        description="Client session identifier for conversation continuity"
    )
    location_region: Optional[str] = Field(default="Punjab", description="Farmer's district or region")


class AssistantChatResponse(BaseModel):
    reply: str = Field(..., description="Conversational, empathetic answer in farmer's preferred language")
    detected_language: str = Field(..., description="Language of response ('hi', 'pa', or 'en')")
    session_id: str
    tools_called: List[ToolInvocationSummary] = Field(default_factory=list)
    structured_data: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional structured payload (e.g. residue estimation, quote rates, hotspot stats)"
    )
    provider_used: str = Field(..., description="'bedrock', 'ollama', or 'mock'")
    disclaimer: str = (
        "This AI assistant provides information and advisory guidance. "
        "Final prices, bindings contracts, and payments are strictly governed by Member 2's Java rules service."
    )
