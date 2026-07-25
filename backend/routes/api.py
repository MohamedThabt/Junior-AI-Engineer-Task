"""API route definitions."""

from fastapi import APIRouter, Request
from pydantic import BaseModel
from starlette.responses import JSONResponse

from config.limiter import limiter
from app.controllers import agent_controller, session_controller

router = APIRouter()


@router.get("/health")
@limiter.limit("60/minute")
async def health_check(request: Request):
    """Health check endpoint."""
    return {"status": "healthy"}


class AgentChatRequest(BaseModel):
    session_id: str | None = None
    message: str


@router.post("/agent/chat", tags=["Agent"])
@limiter.limit("20/minute")
def agent_chat(request: Request, body: AgentChatRequest):
    """Send a message to the agent loop.

    Declared as a sync ``def`` (not ``async def``) so FastAPI dispatches it
    to the threadpool automatically — ``handle_message`` -> ``loop_controller``
    -> ``call_llm`` is a blocking call chain (including retry backoff) that
    would otherwise block the event loop.
    """
    result = agent_controller.handle_message(body.session_id, body.message)
    if result["status"] != 200:
        return JSONResponse(status_code=result["status"], content={"error": result["error"]})
    return {"answer": result["answer"], "session_id": result["session_id"]}


router.include_router(
    session_controller.router,
    prefix="/sessions",
    tags=["Sessions"]
)
