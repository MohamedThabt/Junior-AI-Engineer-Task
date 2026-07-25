"""Unit tests for app/utilities/logging_utils.py."""

import json
import logging

import app.utilities.logging_utils as logging_utils


def _read_json_lines(log_file):
    return [json.loads(line) for line in log_file.read_text(encoding="utf-8").splitlines() if line]


def test_configure_logging_writes_to_configured_log_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(logging_utils, "LOG_DIR", tmp_path)
    logging_utils.configure_logging()

    logging_utils.log_session_event("session_start", "sess-1", "req-1", is_new=True)

    log_file = tmp_path / "app.log"
    assert log_file.exists()
    entries = _read_json_lines(log_file)
    assert entries[-1]["event"] == "session_start"
    assert entries[-1]["session_id"] == "sess-1"
    assert entries[-1]["request_id"] == "req-1"
    assert entries[-1]["is_new"] is True


def test_log_llm_call_writes_all_required_fields(tmp_path, monkeypatch):
    monkeypatch.setattr(logging_utils, "LOG_DIR", tmp_path)
    logging_utils.configure_logging()

    logging_utils.log_llm_call(
        request_id="req-1",
        step_number=1,
        model="llama-3.3-70b-versatile",
        prompt_tokens=10,
        completion_tokens=5,
        total_tokens=15,
        latency_ms=123.4,
        cost_usd=0.0,
        attempt_number=1,
        success=True,
        error=None,
    )

    entry = _read_json_lines(tmp_path / "app.log")[-1]
    for field in (
        "request_id", "step_number", "model", "prompt_tokens", "completion_tokens",
        "total_tokens", "latency_ms", "cost_usd", "attempt_number", "success", "error",
        "timestamp",
    ):
        assert field in entry


def test_log_tool_call_redacts_sensitive_arg_fields(tmp_path, monkeypatch):
    monkeypatch.setattr(logging_utils, "LOG_DIR", tmp_path)
    logging_utils.configure_logging()

    logging_utils.log_tool_call(
        request_id="req-1",
        step_number=1,
        tool_name="insert_listing",
        args={"city": "Austin", "api_key": "sk-should-not-appear", "password": "secret123"},
        attempt_number=1,
        latency_ms=42.0,
        success=True,
        error=None,
    )

    entry = _read_json_lines(tmp_path / "app.log")[-1]
    assert entry["args"]["city"] == "Austin"
    assert entry["args"]["api_key"] == "[REDACTED]"
    assert entry["args"]["password"] == "[REDACTED]"


def test_logging_failure_does_not_raise(tmp_path, monkeypatch):
    monkeypatch.setattr(logging_utils, "LOG_DIR", tmp_path)
    logging_utils.configure_logging()

    class Unserializable:
        def __repr__(self):
            raise RuntimeError("cannot even repr this")

    def _broken_info(*_args, **_kwargs):
        raise RuntimeError("logging backend is down")

    monkeypatch.setattr(logging.getLogger(logging_utils._LOGGER_NAME), "info", _broken_info)

    logging_utils.log_tool_call(
        request_id="req-1",
        step_number=1,
        tool_name="insert_listing",
        args={"note": Unserializable()},
        attempt_number=1,
        latency_ms=1.0,
        success=False,
        error="boom",
    )
