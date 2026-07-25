"""Unit tests for `app/agent/executor.py`."""

from app.agent.executor import dispatch
from app.models.schemas import ToolResult


class TestDispatchUnknownTool:
    def test_unknown_tool_name_returns_structured_error_without_invoking_anything(self):
        result = dispatch("delete_everything", {}, loop_iteration=1, request_id="req-1")

        assert result.success is False
        assert result.data is None
        assert "Unknown tool" in result.error
        assert result.tool == "delete_everything"
        assert result.attempts == 0


class TestDispatchValidationFailure:
    def test_invalid_arguments_return_structured_error_and_never_call_the_tool(self, monkeypatch):
        import app.agent.executor as executor_module

        wasCalled = {"value": False}

        def _spyTool(args, **_kwargs):
            wasCalled["value"] = True
            return ToolResult(success=True, data={}, error=None, tool="query_real_estate", attempts=1)

        monkeypatch.setitem(executor_module.TOOL_REGISTRY, "query_real_estate", _spyTool)

        result = dispatch("query_real_estate", {"min_price": 500, "max_price": 100}, loop_iteration=1, request_id="req-1")

        assert result.success is False
        assert "invalid arguments" in result.error
        assert wasCalled["value"] is False


class TestDispatchValidCall:
    def test_valid_call_returns_the_tools_result_unchanged(self, monkeypatch):
        import app.agent.executor as executor_module

        expectedResult = ToolResult(
            success=True,
            data={"listings": [], "count": 0},
            error=None,
            tool="query_real_estate",
            attempts=1,
        )

        def _fakeTool(args, **_kwargs):
            return expectedResult

        monkeypatch.setitem(executor_module.TOOL_REGISTRY, "query_real_estate", _fakeTool)

        result = dispatch("query_real_estate", {"city": "Austin"}, loop_iteration=2, request_id="req-2")

        assert result is expectedResult

    def test_valid_call_logs_the_dispatch_outcome(self, monkeypatch):
        import app.agent.executor as executor_module

        logged = []
        monkeypatch.setattr(
            executor_module,
            "log_tool_call",
            lambda **kwargs: logged.append(kwargs),
        )
        monkeypatch.setitem(
            executor_module.TOOL_REGISTRY,
            "query_real_estate",
            lambda args, **_kwargs: ToolResult(
                success=True, data={"count": 0, "listings": []}, error=None, tool="query_real_estate", attempts=1
            ),
        )

        dispatch("query_real_estate", {"city": "Austin"}, loop_iteration=3, request_id="req-3")

        assert len(logged) == 1
        assert logged[0]["tool_name"] == "query_real_estate"
        assert logged[0]["loop_iteration"] == 3
        assert logged[0]["request_id"] == "req-3"
        assert logged[0]["success"] is True

    def test_unexpected_exception_from_the_callable_is_turned_into_a_structured_error(self, monkeypatch):
        import app.agent.executor as executor_module

        def _explodingTool(args, **_kwargs):
            raise RuntimeError("connection reset")

        monkeypatch.setitem(executor_module.TOOL_REGISTRY, "query_real_estate", _explodingTool)

        result = dispatch("query_real_estate", {"city": "Austin"}, loop_iteration=1, request_id="req-4")

        assert result.success is False
        assert "connection reset" in result.error
        assert result.tool == "query_real_estate"
