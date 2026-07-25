"""Unit tests for `app/agent/finalize.py`."""

import json

from app.agent.finalize import (
    FINALIZE_TOOL_NAME,
    _BUDGET_EXHAUSTED_MESSAGE,
    _FALLBACK_MESSAGE,
    forced_finalize,
    graceful_fallback,
    run_finalize,
)


class TestRunFinalize:
    def test_echoes_the_answer_in_the_standard_envelope(self):
        finalAnswer = "There are 3 active listings in Austin."

        result = run_finalize(finalAnswer)

        assert result.success is True
        assert result.data == {"answer": finalAnswer}
        assert result.error is None
        assert result.tool == FINALIZE_TOOL_NAME
        assert result.attempts == 1


class TestForcedFinalize:
    def test_summarizes_successful_tool_results_in_context(self):
        toolResultEnvelope = {
            "success": True,
            "data": {"listings": [{"listing_id": "LST-5001"}], "count": 1},
            "error": None,
            "tool": "query_real_estate",
            "attempts": 1,
        }
        context = [
            {"role": "user", "content": "Show listings in Austin"},
            {"role": "tool", "content": json.dumps(toolResultEnvelope)},
        ]

        result = forced_finalize(context)

        assert result.success is True
        assert result.tool == FINALIZE_TOOL_NAME
        assert "query_real_estate" in result.data["answer"]
        assert "LST-5001" in result.data["answer"]

    def test_uses_meta_mirror_for_structured_entries(self):
        toolResultEnvelope = {
            "success": True,
            "data": {"listings": [{"listing_id": "LST-7777"}], "count": 1},
            "error": None,
            "tool": "query_real_estate",
            "attempts": 1,
        }
        context = [
            {
                "role": "tool",
                "tool_call_id": "call_req-a_1",
                "content": json.dumps(toolResultEnvelope),
                "meta": {
                    "type": "tool_result",
                    "request_id": "req-a",
                    "tool": "query_real_estate",
                    "success": True,
                },
            }
        ]

        result = forced_finalize(context)

        assert "query_real_estate" in result.data["answer"]
        assert "LST-7777" in result.data["answer"]

    def test_returns_fixed_budget_message_when_context_has_no_usable_results(self):
        context = [{"role": "user", "content": "Show listings in Austin"}]

        result = forced_finalize(context)

        assert result.success is True
        assert result.data == {"answer": _BUDGET_EXHAUSTED_MESSAGE}

    def test_ignores_failed_tool_results_when_summarizing(self):
        failedResultEnvelope = {
            "success": False,
            "data": None,
            "error": "query_real_estate failed after 2 attempts: boom",
            "tool": "query_real_estate",
            "attempts": 2,
        }
        context = [{"role": "tool", "content": json.dumps(failedResultEnvelope)}]

        result = forced_finalize(context)

        assert result.data == {"answer": _BUDGET_EXHAUSTED_MESSAGE}

    def test_skips_malformed_context_entries_without_raising(self):
        context = [
            {"role": "tool", "content": "not valid json"},
            {"role": "tool"},  # missing "content"
            "not even a dict",
            {"role": "user", "content": "hello"},
        ]

        result = forced_finalize(context)

        assert result.success is True
        assert result.data == {"answer": _BUDGET_EXHAUSTED_MESSAGE}


class TestGracefulFallback:
    def test_returns_the_fixed_safe_message_with_no_internals(self):
        result = graceful_fallback()

        assert result.success is True
        assert result.data == {"answer": _FALLBACK_MESSAGE}
        assert result.error is None
        assert result.tool == FINALIZE_TOOL_NAME
        assert "Traceback" not in result.data["answer"]
