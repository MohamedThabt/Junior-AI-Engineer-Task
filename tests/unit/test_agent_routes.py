"""Unit tests for `POST /api/agent/chat` (`routes/api.py`).

`agent_controller.handle_message` is monkeypatched so these tests never
reach a real LLM call; only the HTTP-layer translation (status codes,
response shape) is under test here.
"""

from fastapi.testclient import TestClient

import app.controllers.agent_controller as agent_controller_module
from main import app

client = TestClient(app)


class TestAgentChatRoute:
    def test_empty_message_returns_400_with_error_body(self, db_conn):
        response = client.post("/api/agent/chat", json={"session_id": None, "message": ""})

        assert response.status_code == 400
        assert "error" in response.json()

    def test_message_with_pii_returns_400_with_generic_error_and_no_secret_echoed(self, db_conn):
        emailMessage = "My email is jane.smith@example.com, can you look up my listings?"

        response = client.post("/api/agent/chat", json={"session_id": None, "message": emailMessage})

        assert response.status_code == 400
        body = response.json()
        assert body["error"] == "request contains data that can't be processed"
        assert "jane.smith@example.com" not in str(body)

    def test_clean_message_returns_200_with_answer_and_session_id(self, db_conn, monkeypatch):
        monkeypatch.setattr(
            agent_controller_module.loop_controller,
            "run",
            lambda *_a, **_kw: ("The average price is $350,000.", "session-xyz"),
        )

        response = client.post(
            "/api/agent/chat",
            json={"session_id": "session-xyz", "message": "What is the average listing price?"},
        )

        assert response.status_code == 200
        body = response.json()
        assert body == {"answer": "The average price is $350,000.", "session_id": "session-xyz"}
