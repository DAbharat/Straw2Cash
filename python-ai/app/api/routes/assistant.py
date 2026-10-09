"""
API route for the Multilingual Farmer AI Assistant.
"""

from fastapi import APIRouter, HTTPException, status
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse
from app.services.assistant_service import AssistantService, SESSION_HISTORY
from app.core.logging import logger

router = APIRouter(prefix="/assistant", tags=["Farmer AI Assistant"])


@router.post(
    "/chat",
    response_model=AssistantChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Chat with Farmer AI Assistant (Hindi / Punjabi / English)",
    description="Multilingual conversational assistant powered by Strands Agents SDK. "
                "Answers residue calculation queries, buyer demand, market pricing, and baler scheduling."
)
async def chat_with_assistant(request: AssistantChatRequest) -> AssistantChatResponse:
    try:
        response = await AssistantService.chat(request)
        logger.info(
            f"Assistant response generated [Session: {response.session_id}, "
            f"Lang: {response.detected_language}, Tools: {len(response.tools_called)}]"
        )
        return response
    except Exception as ex:
        logger.error(f"Error in assistant chat: {str(ex)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Assistant chat error: {str(ex)}"
        )


@router.get(
    "/history/{session_id}",
    summary="Get conversation history for session",
    description="Retrieves the isolated message log for a specific session ID."
)
async def get_session_history(session_id: str):
    history = SESSION_HISTORY.get(session_id, [])
    return {
        "session_id": session_id,
        "total_messages": len(history),
        "history": history
    }
