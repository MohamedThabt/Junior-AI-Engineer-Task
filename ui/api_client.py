"""HTTP client for talking to the backend API from the Gradio UI.

Because the UI is mounted onto the same FastAPI process, requests are sent to
the local server. The base URL is configurable so the UI can also point at a
remote backend during development.
"""

import os

import httpx

# The UI runs inside the same process as the API, so default to localhost.
# ``UI_API_BASE_URL`` lets you point the UI at a different backend if needed.
API_BASE_URL = os.getenv("UI_API_BASE_URL", "http://127.0.0.1:8000")

_REQUEST_TIMEOUT = 10.0


def get_health() -> dict:
    """Call the FastAPI ``/api/health`` route and return its JSON payload.

    Returns a dict with an ``ok`` flag plus either the parsed response body or
    an ``error`` message, so the UI can render a friendly status either way.
    """
    url = f"{API_BASE_URL}/api/health"
    try:
        response = httpx.get(url, timeout=_REQUEST_TIMEOUT)
        response.raise_for_status()
        return {"ok": True, "data": response.json()}
    except httpx.HTTPStatusError as exc:
        return {"ok": False, "error": f"HTTP {exc.response.status_code}: {exc.response.text}"}
    except httpx.HTTPError as exc:
        return {"ok": False, "error": str(exc)}
