"""Unit tests for app/agent/llm_factory.py."""

import json
from unittest.mock import MagicMock
import sys

import pytest

from app.agent.llm_factory import GroqClient, get_llm_client
from config.settings import settings


class _FakeBadRequestError(Exception):
    """Stands in for `groq.BadRequestError`: carries a parsed `.body` dict
    the same way the real SDK exception does."""

    def __init__(self, body: dict):
        super().__init__("Bad request")
        self.body = body


@pytest.fixture(autouse=True)
def _fake_groq_api_key(monkeypatch):
    """GroqClient construction requires a non-empty API key and SDK.
    Mock the `groq` module so unit tests can instantiate GroqClient safely."""
    monkeypatch.setattr(settings, "groq_api_key", "fake-key-for-tests")
    fake_groq_module = MagicMock()
    fake_groq_module.Groq = MagicMock(return_value=MagicMock())
    fake_groq_module.BadRequestError = _FakeBadRequestError
    monkeypatch.setitem(sys.modules, "groq", fake_groq_module)


def test_get_llm_client_returns_groq_client_for_groq_provider():
    client = get_llm_client("groq")

    assert isinstance(client, GroqClient)


def test_get_llm_client_is_case_insensitive():
    client = get_llm_client("Groq")

    assert isinstance(client, GroqClient)


def test_get_llm_client_raises_value_error_for_unknown_provider():
    unknown_provider = "anthropic"

    with pytest.raises(ValueError, match=unknown_provider):
        get_llm_client(unknown_provider)


class TestToolUseFailedRecovery:
    """Regression tests: Groq returns `tool_use_failed` (400) instead of a
    usable response whenever Llama's raw `<function=name>{...}</function>`
    text is malformed or fails schema validation — but the intended call is
    still readable as text in `failed_generation`. `GroqClient.generate`
    should recover it rather than let the whole step fail."""

    def _make_client_raising(self, error: Exception) -> GroqClient:
        client = GroqClient()
        client._client.chat.completions.create.side_effect = error
        return client

    def test_recovers_a_call_missing_the_closing_angle_bracket(self):
        error = _FakeBadRequestError(
            {
                "error": {
                    "code": "tool_use_failed",
                    "failed_generation": '<function=finalize{"answer": "here you go"}</function>',
                }
            }
        )
        client = self._make_client_raising(error)

        response = client.generate(messages=[], tools=[], model="llama-3.3-70b-versatile")

        tool_call = response.choices[0].message.tool_calls[0]
        assert tool_call.function.name == "finalize"
        assert json.loads(tool_call.function.arguments) == {"answer": "here you go"}

    def test_recovers_a_call_using_a_space_instead_of_the_angle_bracket(self):
        error = _FakeBadRequestError(
            {
                "error": {
                    "code": "tool_use_failed",
                    "failed_generation": '<function=finalize {"answer": "done"}</function>',
                }
            }
        )
        client = self._make_client_raising(error)

        response = client.generate(messages=[], tools=[], model="llama-3.3-70b-versatile")

        tool_call = response.choices[0].message.tool_calls[0]
        assert tool_call.function.name == "finalize"
        assert json.loads(tool_call.function.arguments) == {"answer": "done"}

    def test_recovers_a_call_using_a_doubled_equals_sign(self):
        error = _FakeBadRequestError(
            {
                "error": {
                    "code": "tool_use_failed",
                    "failed_generation": '<function=finalize={"answer": "no matches"} </function>',
                }
            }
        )
        client = self._make_client_raising(error)

        response = client.generate(messages=[], tools=[], model="llama-3.3-70b-versatile")

        tool_call = response.choices[0].message.tool_calls[0]
        assert tool_call.function.name == "finalize"
        assert json.loads(tool_call.function.arguments) == {"answer": "no matches"}

    def test_reraises_when_failed_generation_is_unparseable(self):
        error = _FakeBadRequestError(
            {"error": {"code": "tool_use_failed", "failed_generation": "not a function call at all"}}
        )
        client = self._make_client_raising(error)

        with pytest.raises(_FakeBadRequestError):
            client.generate(messages=[], tools=[], model="llama-3.3-70b-versatile")

    def test_reraises_for_a_different_error_code(self):
        error = _FakeBadRequestError({"error": {"code": "rate_limit_exceeded"}})
        client = self._make_client_raising(error)

        with pytest.raises(_FakeBadRequestError):
            client.generate(messages=[], tools=[], model="llama-3.3-70b-versatile")
