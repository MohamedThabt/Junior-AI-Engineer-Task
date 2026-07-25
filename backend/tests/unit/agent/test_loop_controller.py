"""Unit tests for `app/agent/loop_controller.py`.

`planner.plan` / `executor.dispatch` are monkeypatched so these tests never
hit a real LLM or tool; `db_conn` (from `tests/conftest.py`) backs
`ChatSessionRepository` with an in-memory SQLite database.
"""

import json

import app.agent.loop_controller as loop_controller_module
from app.agent.loop_controller import run
from app.agent.planner import PlannerDecision
from app.models.schemas import ToolResult
from app.repositories.chat_session_repository import ChatSessionRepository
from config.settings import settings


def _fakeSuccessfulToolResult(tool_name="query_real_estate"):
    return ToolResult(
        success=True,
        data={"listings": [{"listing_id": "LST-5001"}], "count": 1},
        error=None,
        tool=tool_name,
        attempts=1,
    )


class TestNormalFinalizePath:
    def test_llm_calls_finalize_on_step_two_persists_context_and_returns_answer(
        self, db_conn, monkeypatch
    ):
        decisions = [
            PlannerDecision(type="tool_call", tool_name="query_real_estate", args={"city": "Austin"}),
            PlannerDecision(type="finalize", answer="Found 1 listing in Austin."),
        ]
        monkeypatch.setattr(loop_controller_module.planner, "plan", lambda *_a, **_kw: decisions.pop(0))
        monkeypatch.setattr(
            loop_controller_module.executor,
            "dispatch",
            lambda *_a, **_kw: _fakeSuccessfulToolResult(),
        )

        answer, sessionId = run(None, "Show listings in Austin", "req-normal")

        assert answer == "Found 1 listing in Austin."
        assert sessionId

        persistedContext = ChatSessionRepository.get_context(sessionId)
        roles = [entry["role"] for entry in persistedContext]
        assert roles == ["user", "tool", "assistant"]
        assert persistedContext[0]["content"] == "Show listings in Austin"
        assert persistedContext[-1]["content"] == "Found 1 listing in Austin."
        toolEnvelope = json.loads(persistedContext[1]["content"])
        assert toolEnvelope["tool"] == "query_real_estate"


class TestForcedFinalize:
    def test_exits_at_max_steps_when_llm_never_calls_finalize(self, db_conn, monkeypatch):
        monkeypatch.setattr(settings, "max_steps", 2)
        planCallCount = {"value": 0}

        def _countingPlan(*_args, **_kwargs):
            planCallCount["value"] += 1
            return PlannerDecision(type="tool_call", tool_name="query_real_estate", args={"city": "Austin"})

        monkeypatch.setattr(loop_controller_module.planner, "plan", _countingPlan)
        monkeypatch.setattr(
            loop_controller_module.executor,
            "dispatch",
            lambda *_a, **_kw: _fakeSuccessfulToolResult(),
        )

        answer, sessionId = run(None, "Show listings in Austin", "req-forced")

        assert planCallCount["value"] == 2
        assert "step limit" in answer


class TestExceptionHandling:
    def test_unhandled_exception_returns_graceful_fallback_and_still_persists_context(
        self, db_conn, monkeypatch
    ):
        monkeypatch.setattr(
            loop_controller_module.planner,
            "plan",
            lambda *_a, **_kw: PlannerDecision(
                type="tool_call", tool_name="query_real_estate", args={"city": "Austin"}
            ),
        )

        def _explodingDispatch(*_args, **_kwargs):
            raise RuntimeError("simulated executor crash")

        monkeypatch.setattr(loop_controller_module.executor, "dispatch", _explodingDispatch)

        answer, sessionId = run(None, "Show listings in Austin", "req-crash")

        assert answer == "Something went wrong processing that request — please try again or rephrase it."
        persistedContext = ChatSessionRepository.get_context(sessionId)
        assert persistedContext[0]["content"] == "Show listings in Austin"
        assert persistedContext[-1]["content"] == answer


class TestSessionResolution:
    def test_new_session_created_when_session_id_is_none(self, db_conn, monkeypatch):
        monkeypatch.setattr(
            loop_controller_module.planner,
            "plan",
            lambda *_a, **_kw: PlannerDecision(type="finalize", answer="Hi there."),
        )

        answer, sessionId = run(None, "Hello", "req-new-session")

        session = ChatSessionRepository.get_session(sessionId)
        assert session is not None
        assert session["session_name"] == "Hello"

    def test_resumes_existing_session_when_session_id_given(self, db_conn, monkeypatch):
        existingSessionId = ChatSessionRepository.create_session("Existing session")
        ChatSessionRepository.save_context(existingSessionId, [{"role": "user", "content": "earlier turn"}])
        monkeypatch.setattr(
            loop_controller_module.planner,
            "plan",
            lambda *_a, **_kw: PlannerDecision(type="finalize", answer="Continuing."),
        )

        answer, sessionId = run(existingSessionId, "Follow up question", "req-resume")

        assert sessionId == existingSessionId
        persistedContext = ChatSessionRepository.get_context(sessionId)
        assert persistedContext[0]["content"] == "earlier turn"
        assert persistedContext[1]["content"] == "Follow up question"
