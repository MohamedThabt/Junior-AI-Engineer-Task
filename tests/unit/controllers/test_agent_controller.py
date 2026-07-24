"""Unit tests for `app/controllers/agent_controller.py`.

`loop_controller.run` is monkeypatched so these tests never reach a real
LLM call.
"""

import app.controllers.agent_controller as agent_controller_module
from app.controllers.agent_controller import MAX_MESSAGE_LENGTH, handle_message


class TestSyntaxValidation:
    def test_empty_message_returns_400(self):
        result = handle_message(None, "")

        assert result["status"] == 400
        assert "error" in result

    def test_whitespace_only_message_returns_400(self):
        result = handle_message(None, "   ")

        assert result["status"] == 400

    def test_message_exceeding_max_length_returns_400(self):
        tooLongMessage = "a" * (MAX_MESSAGE_LENGTH + 1)

        result = handle_message(None, tooLongMessage)

        assert result["status"] == 400
        assert "exceeds maximum length" in result["error"]


class TestSecurityScan:
    def test_message_with_email_returns_400_and_logs_security_event_without_leaking_it(
        self, monkeypatch
    ):
        loggedEvents = []
        monkeypatch.setattr(
            agent_controller_module,
            "log_security_event",
            lambda **kwargs: loggedEvents.append(kwargs),
        )
        emailMessage = "Please contact jane.smith@example.com about the listing."

        result = handle_message(None, emailMessage)

        assert result["status"] == 400
        assert result["error"] == "request contains data that can't be processed"
        assert "jane.smith@example.com" not in result["error"]
        assert len(loggedEvents) == 1
        assert loggedEvents[0]["pattern_type"] == "email"

    def test_clean_message_does_not_trigger_a_security_event(self, monkeypatch):
        loggedEvents = []
        monkeypatch.setattr(
            agent_controller_module,
            "log_security_event",
            lambda **kwargs: loggedEvents.append(kwargs),
        )
        monkeypatch.setattr(
            agent_controller_module.loop_controller,
            "run",
            lambda *_a, **_kw: ("answer text", "session-123"),
        )

        handle_message(None, "What is the average listing price?")

        assert loggedEvents == []


class TestHappyPath:
    def test_clean_message_calls_loop_controller_and_returns_its_answer(self, monkeypatch):
        capturedArgs = {}

        def _fakeRun(session_id, message, request_id):
            capturedArgs["session_id"] = session_id
            capturedArgs["message"] = message
            capturedArgs["request_id"] = request_id
            return "Here is your answer.", "session-abc"

        monkeypatch.setattr(agent_controller_module.loop_controller, "run", _fakeRun)

        result = handle_message("session-abc", "What is the average listing price?")

        assert result == {"answer": "Here is your answer.", "session_id": "session-abc", "status": 200}
        assert capturedArgs["session_id"] == "session-abc"
        assert capturedArgs["message"] == "What is the average listing price?"
        assert capturedArgs["request_id"]
