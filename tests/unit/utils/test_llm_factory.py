"""Unit tests for app/agent/llm_factory.py."""

from unittest.mock import MagicMock
import sys

import pytest

from app.agent.llm_factory import GeminiClient, get_llm_client
from config.settings import settings


@pytest.fixture(autouse=True)
def _fake_gemini_api_key(monkeypatch):
    """GeminiClient construction requires a non-empty API key and SDK.
    Mock google.genai so unit tests can instantiate GeminiClient safely."""
    monkeypatch.setattr(settings, "gemini_api_key", "fake-key-for-tests")
    fake_genai = MagicMock()
    monkeypatch.setitem(sys.modules, "google", MagicMock(genai=fake_genai))
    monkeypatch.setitem(sys.modules, "google.genai", fake_genai)


def test_get_llm_client_returns_gemini_client_for_gemini_provider():
    client = get_llm_client("gemini")

    assert isinstance(client, GeminiClient)


def test_get_llm_client_is_case_insensitive():
    client = get_llm_client("Gemini")

    assert isinstance(client, GeminiClient)


def test_get_llm_client_raises_value_error_for_unknown_provider():
    unknown_provider = "anthropic"

    with pytest.raises(ValueError, match=unknown_provider):
        get_llm_client(unknown_provider)
