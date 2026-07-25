"""Unit tests for app/agent/llm_client.py.

The provider client is faked out via monkeypatching `get_llm_client` so
these tests never hit a real LLM API.
"""

import json
from types import SimpleNamespace

import pytest

import app.agent.llm_client as llm_client_module
from app.agent.llm_client import LLMCallError, call_llm


def _fake_raw_response(prompt_tokens=10, completion_tokens=5, text="final answer", tool_calls=None):
    total_tokens = prompt_tokens + completion_tokens
    usage = SimpleNamespace(
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
    )
    fake_tool_calls = [
        SimpleNamespace(
            function=SimpleNamespace(name=call["tool_name"], arguments=json.dumps(call["args"]))
        )
        for call in (tool_calls or [])
    ]
    message = SimpleNamespace(content=text, tool_calls=fake_tool_calls)
    return SimpleNamespace(usage=usage, choices=[SimpleNamespace(message=message)])


class _FakeProviderClient:
    """Stands in for GroqClient: `responses` is a queue of either an
    Exception instance (to raise) or a raw response (to return)."""

    def __init__(self, responses):
        self._responses = list(responses)
        self.calls = 0

    def generate(self, messages, tools, model):
        self.calls += 1
        outcome = self._responses.pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return outcome


@pytest.fixture(autouse=True)
def _no_sleep(monkeypatch):
    """Retries would otherwise cost 0.5s + 1s per failing test — skip the
    real backoff delay while still exercising the retry loop."""
    monkeypatch.setattr(llm_client_module.time, "sleep", lambda _seconds: None)


@pytest.fixture()
def logged_calls(monkeypatch):
    """Capture every log_llm_call invocation instead of writing to disk."""
    captured = []
    monkeypatch.setattr(
        llm_client_module,
        "log_llm_call",
        lambda **kwargs: captured.append(kwargs),
    )
    return captured


def test_call_llm_success_returns_parsed_response_with_cost(monkeypatch, logged_calls):
    raw = _fake_raw_response(prompt_tokens=10, completion_tokens=5, text="hello")
    fake_client = _FakeProviderClient([raw])
    monkeypatch.setattr(llm_client_module, "get_llm_client", lambda _provider: fake_client)

    response = call_llm(
        messages=[{"role": "user", "content": "hi"}],
        tools=[],
        model="llama-3.3-70b-versatile",
        loop_iteration=1,
        request_id="req-1",
    )

    assert response.text == "hello"
    assert response.prompt_tokens == 10
    assert response.completion_tokens == 5
    assert response.total_tokens == 15
    expected_cost = round((10 / 1000) * 0.00059 + (5 / 1000) * 0.00079, 8)
    assert len(logged_calls) == 1
    assert logged_calls[0]["cost_usd"] == expected_cost
    assert logged_calls[0]["success"] is True
    assert logged_calls[0]["attempt_number"] == 1


def test_call_llm_parses_tool_calls():
    raw = _fake_raw_response(tool_calls=[{"tool_name": "query_listings", "args": {"city": "Austin"}}])

    parsed = llm_client_module._parse_response(raw)

    assert parsed.tool_calls == [{"tool_name": "query_listings", "args": {"city": "Austin"}}]


def test_call_llm_retries_then_succeeds(monkeypatch, logged_calls):
    raw = _fake_raw_response()
    fake_client = _FakeProviderClient([RuntimeError("timeout"), RuntimeError("timeout"), raw])
    monkeypatch.setattr(llm_client_module, "get_llm_client", lambda _provider: fake_client)

    response = call_llm(
        messages=[{"role": "user", "content": "hi"}],
        tools=[],
        model="llama-3.3-70b-versatile",
        loop_iteration=1,
    )

    assert response is not None
    assert fake_client.calls == 3
    assert [entry["attempt_number"] for entry in logged_calls] == [1, 2, 3]
    assert [entry["success"] for entry in logged_calls] == [False, False, True]


def test_call_llm_raises_llm_call_error_after_exhausting_retries(monkeypatch, logged_calls):
    fake_client = _FakeProviderClient(
        [RuntimeError("boom 1"), RuntimeError("boom 2"), RuntimeError("boom 3")]
    )
    monkeypatch.setattr(llm_client_module, "get_llm_client", lambda _provider: fake_client)

    with pytest.raises(LLMCallError):
        call_llm(
            messages=[{"role": "user", "content": "hi"}],
            tools=[],
            model="llama-3.3-70b-versatile",
            loop_iteration=1,
        )

    assert fake_client.calls == 3
    assert len(logged_calls) == 3
    assert all(entry["success"] is False for entry in logged_calls)


def test_call_llm_uses_zero_cost_for_unknown_model_pricing(monkeypatch, logged_calls):
    raw = _fake_raw_response(prompt_tokens=100, completion_tokens=50)
    fake_client = _FakeProviderClient([raw])
    monkeypatch.setattr(llm_client_module, "get_llm_client", lambda _provider: fake_client)

    call_llm(
        messages=[{"role": "user", "content": "hi"}],
        tools=[],
        model="some-unpriced-model",
        loop_iteration=1,
    )

    assert logged_calls[0]["cost_usd"] == 0.0
