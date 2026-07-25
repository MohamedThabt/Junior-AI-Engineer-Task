"""Unit tests for `app/agent/planner.py`.

`call_llm` is monkeypatched directly (same approach as
`tests/unit/utils/test_llm_client.py`) so these tests never hit a real LLM.
"""

import pytest

import app.agent.planner as planner_module
from app.agent.llm_client import LLMCallError, LLMResponse
from app.agent.planner import PlannerDecision, plan


def test_plan_returns_tool_call_decision_for_a_data_tool_call(monkeypatch):
    fakeResponse = LLMResponse(
        raw=None,
        tool_calls=[{"tool_name": "query_real_estate", "args": {"city": "Austin"}}],
        text=None,
    )
    monkeypatch.setattr(planner_module, "call_llm", lambda **_kwargs: fakeResponse)

    decision = plan("system prompt", [], tool_schemas=[], step_number=1)

    assert decision == PlannerDecision(
        type="tool_call", tool_name="query_real_estate", args={"city": "Austin"}
    )


def test_plan_returns_finalize_decision_when_llm_calls_finalize(monkeypatch):
    fakeResponse = LLMResponse(
        raw=None,
        tool_calls=[{"tool_name": "finalize", "args": {"answer": "Here are the results."}}],
        text=None,
    )
    monkeypatch.setattr(planner_module, "call_llm", lambda **_kwargs: fakeResponse)

    decision = plan("system prompt", [], tool_schemas=[], step_number=2)

    assert decision.type == "finalize"
    assert decision.answer == "Here are the results."


def test_plan_treats_text_only_response_as_implicit_finalize(monkeypatch):
    fakeResponse = LLMResponse(raw=None, tool_calls=[], text="I already know the answer.")
    monkeypatch.setattr(planner_module, "call_llm", lambda **_kwargs: fakeResponse)

    decision = plan("system prompt", [], tool_schemas=[], step_number=1)

    assert decision.type == "finalize"
    assert decision.answer == "I already know the answer."


def test_plan_dispatches_only_the_first_of_multiple_tool_calls(monkeypatch):
    fakeResponse = LLMResponse(
        raw=None,
        tool_calls=[
            {"tool_name": "query_real_estate", "args": {"city": "Austin"}},
            {"tool_name": "query_campaigns", "args": {"channel": "Facebook"}},
        ],
        text=None,
    )
    monkeypatch.setattr(planner_module, "call_llm", lambda **_kwargs: fakeResponse)

    decision = plan("system prompt", [], tool_schemas=[], step_number=1)

    assert decision.tool_name == "query_real_estate"


def test_plan_propagates_llm_call_error_unchanged(monkeypatch):
    def _raiseLlmCallError(**_kwargs):
        raise LLMCallError("call_llm failed after 3 attempts")

    monkeypatch.setattr(planner_module, "call_llm", _raiseLlmCallError)

    with pytest.raises(LLMCallError):
        plan("system prompt", [], tool_schemas=[], step_number=1)
