"""Unit tests for `app/agent/memory.py`."""

import json

from app.agent import memory


class TestEntryBuilders:
    def test_tool_call_entry_carries_args_and_call_id(self):
        entry = memory.tool_call_entry(
            "call_req_1", "query_real_estate", {"city": "Austin"}, "req", 1
        )

        assert entry["role"] == "assistant"
        assert entry["content"] is None
        call = entry["tool_calls"][0]
        assert call["id"] == "call_req_1"
        assert call["function"]["name"] == "query_real_estate"
        assert json.loads(call["function"]["arguments"]) == {"city": "Austin"}
        assert entry["meta"]["request_id"] == "req"
        assert entry["meta"]["step"] == 1

    def test_tool_result_entry_mirrors_audit_fields_into_meta(self):
        class _R:
            tool = "query_real_estate"
            success = False
            error = "boom"
            attempts = 2

            def model_dump(self):
                return {
                    "tool": self.tool,
                    "success": self.success,
                    "error": self.error,
                    "attempts": self.attempts,
                    "data": None,
                }

        entry = memory.tool_result_entry("call_req_1", _R(), "req", 1, latency_ms=12.5)

        assert entry["role"] == "tool"
        assert entry["tool_call_id"] == "call_req_1"
        assert entry["meta"]["success"] is False
        assert entry["meta"]["error"] == "boom"
        assert entry["meta"]["attempts"] == 2
        assert entry["meta"]["latency_ms"] == 12.5


class TestRequestScoping:
    def test_entries_for_request_filters_by_request_id(self):
        context = [
            memory.user_entry("first turn", "req-a"),
            memory.user_entry("second turn", "req-b"),
            {"role": "user", "content": "legacy no-meta entry"},
        ]

        scoped = memory.entries_for_request(context, "req-b")

        assert len(scoped) == 1
        assert scoped[0]["content"] == "second turn"


class TestSuccessfulToolResults:
    def test_prefers_meta_mirror(self):
        envelope = {"success": True, "tool": "query_real_estate", "data": {"count": 1}}
        context = [
            {
                "role": "tool",
                "tool_call_id": "c1",
                "content": json.dumps(envelope),
                "meta": {"type": "tool_result", "success": True, "tool": "query_real_estate"},
            }
        ]

        results = memory.successful_tool_results(context)

        assert len(results) == 1
        assert results[0]["tool"] == "query_real_estate"

    def test_skips_failed_and_parses_legacy_entries(self):
        failed = {"success": False, "tool": "x", "data": None}
        legacy_ok = {"success": True, "tool": "query_campaigns", "data": {"count": 3}}
        context = [
            {"role": "tool", "content": json.dumps(failed), "meta": {"type": "tool_result", "success": False}},
            {"role": "tool", "content": json.dumps(legacy_ok)},  # legacy: no meta
        ]

        results = memory.successful_tool_results(context)

        assert [r["tool"] for r in results] == ["query_campaigns"]


class TestPrepareContext:
    def _tool_result(self, request_id, step, data):
        envelope = {"success": True, "tool": "query_real_estate", "data": data, "error": None, "attempts": 1}
        return {
            "role": "tool",
            "tool_call_id": f"call_{request_id}_{step}",
            "content": json.dumps(envelope),
            "meta": {"type": "tool_result", "request_id": request_id, "step": step, "success": True},
        }

    def test_keeps_all_when_within_window(self):
        context = [memory.user_entry("q1", "r1"), memory.assistant_answer_entry("a1", "r1")]

        prepared = memory.prepare_context(context, window=12, max_data_chars=2000)

        assert prepared == context

    def test_summarizes_older_entries_beyond_window(self):
        context = [memory.user_entry(f"q{i}", f"r{i}") for i in range(10)]

        prepared = memory.prepare_context(context, window=4, max_data_chars=2000)

        # 1 summary recap + last 4 verbatim.
        assert len(prepared) == 5
        assert prepared[0]["meta"]["type"] == memory.TYPE_SUMMARY
        assert prepared[-1]["content"] == "q9"

    def test_window_never_starts_on_an_orphan_tool_result(self):
        context = [
            memory.user_entry("q", "r1"),
            memory.tool_call_entry("call_r1_1", "query_real_estate", {"city": "Austin"}, "r1", 1),
            self._tool_result("r1", 1, {"count": 1}),
            memory.assistant_answer_entry("a", "r1"),
        ]

        # window=2 would naively start on the tool result (orphaning it); the
        # tool result must be pushed into the summary instead.
        prepared = memory.prepare_context(context, window=2, max_data_chars=2000)

        assert prepared[0]["meta"]["type"] == memory.TYPE_SUMMARY
        assert all(e.get("role") != "tool" for e in prepared[1:])

    def test_digests_oversized_tool_data(self):
        big_rows = [{"listing_id": f"LST-{i}"} for i in range(500)]
        context = [self._tool_result("r1", 1, {"listings": big_rows})]

        prepared = memory.prepare_context(context, window=12, max_data_chars=200)

        envelope = json.loads(prepared[0]["content"])
        assert envelope["data"]["listings"]["_digested"] is True
        assert envelope["data"]["listings"]["count"] == 500
        assert envelope["data"]["listings"]["sample_ids"] == ["LST-0", "LST-1", "LST-2", "LST-3", "LST-4"]


class TestCompactForPersist:
    def test_digests_large_payloads_but_keeps_thread(self):
        big_rows = [{"listing_id": f"LST-{i}"} for i in range(500)]
        envelope = {"success": True, "tool": "query_real_estate", "data": {"listings": big_rows}, "error": None, "attempts": 1}
        context = [
            memory.user_entry("q", "r1"),
            {
                "role": "tool",
                "tool_call_id": "call_r1_1",
                "content": json.dumps(envelope),
                "meta": {"type": "tool_result", "request_id": "r1", "success": True},
            },
            memory.assistant_answer_entry("a", "r1"),
        ]

        compacted = memory.compact_for_persist(context, max_data_chars=200)

        assert len(compacted) == 3  # full thread retained
        assert compacted[0]["content"] == "q"
        assert compacted[-1]["content"] == "a"
        digested = json.loads(compacted[1]["content"])
        assert digested["data"]["listings"]["_digested"] is True
