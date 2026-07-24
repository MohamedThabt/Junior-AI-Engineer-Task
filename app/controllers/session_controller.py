from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.repositories.chat_session_repository import ChatSessionRepository

router = APIRouter()

class CreateSessionRequest(BaseModel):
    session_name: str = Field(..., min_length=1, max_length=255, description="The name of the new chat session")

class SessionResponse(BaseModel):
    id: str
    session_name: str
    context: str
    created_at: str
    updated_at: str


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_session(request: CreateSessionRequest):
    """Create a new chat session."""
    session_id = ChatSessionRepository.create_session(request.session_name)
    return {"id": session_id, "session_name": request.session_name}


@router.get("/", response_model=list[SessionResponse])
async def list_sessions():
    """List all available chat sessions."""
    sessions = ChatSessionRepository.get_all_sessions()
    return sessions


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
