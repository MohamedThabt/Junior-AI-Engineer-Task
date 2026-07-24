import json

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.repositories.chat_session_repository import ChatSessionRepository

router = APIRouter()


class CreateSessionRequest(BaseModel):
    session_name: str = Field(..., min_length=1, max_length=255, description="The name of the new chat session")


class SessionListItemResponse(BaseModel):
    id: str
    session_id: str
    session_name: str
    created_at: str
    updated_at: str


class SessionDetailResponse(BaseModel):
    id: str
    session_id: str
    session_name: str
    context: list
    created_at: str
    updated_at: str


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_session(request: CreateSessionRequest):
    """Create a new chat session."""
    session_id = ChatSessionRepository.create_session(request.session_name)
    return {"id": session_id, "session_id": session_id, "session_name": request.session_name}


@router.get("/", response_model=list[SessionListItemResponse])
async def list_sessions():
    """List all available chat sessions without the heavy context blob."""
    raw_sessions = ChatSessionRepository.list_sessions()
    return [
        {
            "id": s["id"],
            "session_id": s["id"],
            "session_name": s["session_name"],
            "created_at": s["created_at"],
            "updated_at": s["updated_at"],
        }
        for s in raw_sessions
    ]


@router.get("/{session_id}", response_model=SessionDetailResponse)
async def show_session(session_id: str):
    """Return the full session row including deserialized context list."""
    session = ChatSessionRepository.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    raw_context = session.get("context")
    if isinstance(raw_context, str):
        try:
            context_list = json.loads(raw_context)
        except json.JSONDecodeError:
            context_list = []
    elif isinstance(raw_context, list):
        context_list = raw_context
    else:
        context_list = []

    return {
        "id": session["id"],
        "session_id": session["id"],
        "session_name": session["session_name"],
        "context": context_list,
        "created_at": session["created_at"],
        "updated_at": session["updated_at"],
    }


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(session_id: str):
    """Delete a specific chat session."""
    deleted = ChatSessionRepository.delete_session(session_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    return None

