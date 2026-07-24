"""Agent controller (`docs/agent-architecture.md` §0, §2).

Pure logic, no FastAPI/HTTP code — `handle_message()` is fully unit
testable on its own and returns a plain dict (including an embedded
`status`) for the route layer (`routes/api.py`) to translate into an HTTP
response. This is the fixed pipeline every chat message passes through
before the agent loop ever runs: syntax validation -> PII/secret scan ->
loop controller. The agent and its tools never re-check either of these.
"""

from __future__ import annotations

from app.agent import loop_controller
from app.utilities.logging_utils import log_security_event, new_request_id, request_id_var
from app.utilities.security import scan_for_sensitive_data

MAX_MESSAGE_LENGTH = 4000


def handle_message(session_id: str | None, message: str) -> dict:
    if not message or not message.strip():
        return {"error": "message must not be empty", "status": 400}

    if len(message) > MAX_MESSAGE_LENGTH:
        return {
            "error": f"message exceeds maximum length of {MAX_MESSAGE_LENGTH} characters",
            "status": 400,
        }

    try:
        message.encode("utf-8")
    except UnicodeEncodeError:
        return {"error": "message contains invalid encoding", "status": 400}

    pattern_type = scan_for_sensitive_data(message)
    if pattern_type is not None:
        log_security_event(request_id=new_request_id(), pattern_type=pattern_type)
        return {"error": "request contains data that can't be processed", "status": 400}

    request_id = new_request_id()
    request_id_var.set(request_id)

    answer, resolved_session_id = loop_controller.run(session_id, message, request_id)

    return {"answer": answer, "session_id": resolved_session_id, "status": 200}
