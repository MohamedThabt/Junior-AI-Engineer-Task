"""Conversational-memory shaping for the agent loop.

This module owns two responsibilities that used to be smeared across
`loop_controller` and `finalize`:

1. **Entry vocabulary** — the canonical builders for every kind of history
   entry (`user`, assistant `tool_calls`, `tool` result, assistant answer).
   Every entry is provider-native (OpenAI/Groq message shape) with a `meta`
   sidecar carrying our own bookkeeping (`request_id`, `step`, per-tool
   `success`/`error`/`attempts`/`latency_ms`). The `meta` mirror is what lets
   callers answer "which tools ran, which failed, which succeeded" without
   re-parsing the JSON `content`.

2. **Working- vs long-term-memory shaping**:
   - `prepare_context` builds what is *sent to the LLM* this step — the most
     recent `MEMORY_WINDOW_TURNS` entries verbatim, older ones collapsed into
     a single summary recap, and oversized tool-result payloads digested.
   - `compact_for_persist` builds what is *stored* — the full conversational
     thread and per-tool audit metadata are kept, but heavy row payloads are
     digested so a session blob can't grow without bound.

The `_now_iso` seam (rather than a bare `datetime.now()` call) keeps entry
timestamps monkeypatchable so loop/memory tests stay deterministic.
"""

from __future__ import annotations

import copy
import json
from datetime import datetime, timezone
from typing import Any

from config.settings import settings

# meta["type"] tags — provider ignores meta entirely; these are ours.
TYPE_USER = "user"
TYPE_TOOL_CALL = "tool_call"
TYPE_TOOL_RESULT = "tool_result"
TYPE_ANSWER = "answer"
TYPE_SUMMARY = "summary"


def _now_iso() -> str:
    """UTC ISO-8601 timestamp. Single seam so tests can patch time."""
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Entry builders (provider-native shape + our `meta` sidecar)
# ---------------------------------------------------------------------------


def make_call_id(request_id: str, step: int) -> str:
    """Deterministic id linking an assistant `tool_calls` turn to its `tool`
    result. Deterministic (not a UUID) so tests can assert on it."""
    return f"call_{request_id}_{step}"


def user_entry(text: str, request_id: str) -> dict:
    return {
        "role": "user",
        "content": text,
        "meta": {"type": TYPE_USER, "request_id": request_id, "ts": _now_iso()},
    }


def tool_call_entry(call_id: str, tool_name: str, args: dict, request_id: str, step: int) -> dict:
    return {
        "role": "assistant",
        "content": None,
        "tool_calls": [
            {
                "id": call_id,
                "type": "function",
                "function": {"name": tool_name, "arguments": json.dumps(args or {})},
            }
        ],
        "meta": {
            "type": TYPE_TOOL_CALL,
            "request_id": request_id,
            "step": step,
            "tool": tool_name,
            "ts": _now_iso(),
        },
    }


def tool_result_entry(call_id: str, result: Any, request_id: str, step: int, latency_ms: float | None = None) -> dict:
    """Build the paired `tool` entry for a `ToolResult`. `result` is duck-typed
    (anything with `.tool`/`.success`/`.error`/`.attempts` and `.model_dump()`)."""
    envelope = result.model_dump() if hasattr(result, "model_dump") else dict(result)
    return {
        "role": "tool",
        "tool_call_id": call_id,
        "content": json.dumps(envelope),
        "meta": {
            "type": TYPE_TOOL_RESULT,
            "request_id": request_id,
            "step": step,
            "tool": getattr(result, "tool", envelope.get("tool")),
            "success": getattr(result, "success", envelope.get("success")),
            "error": getattr(result, "error", envelope.get("error")),
            "attempts": getattr(result, "attempts", envelope.get("attempts")),
            "latency_ms": latency_ms,
            "ts": _now_iso(),
        },
    }


def assistant_answer_entry(text: str, request_id: str) -> dict:
    return {
        "role": "assistant",
        "content": text,
        "meta": {"type": TYPE_ANSWER, "request_id": request_id, "ts": _now_iso()},
    }


# ---------------------------------------------------------------------------
# Introspection helpers (used by finalize + summaries)
# ---------------------------------------------------------------------------


def entry_request_id(entry: dict) -> str | None:
    meta = entry.get("meta") if isinstance(entry, dict) else None
    return meta.get("request_id") if isinstance(meta, dict) else None


def entries_for_request(context: list, request_id: str) -> list[dict]:
    """Entries tagged with *request_id*. Legacy entries (no meta) are excluded
    — they belong to older turns and never to the current request."""
    return [e for e in context if isinstance(e, dict) and entry_request_id(e) == request_id]


def _parse_tool_envelope(entry: dict) -> dict | None:
    """Return the `ToolResult` envelope dict for a `tool` entry, from its
    `content` JSON. `None` if the entry isn't a parseable tool result."""
    if not isinstance(entry, dict) or entry.get("role") != "tool":
        return None
    try:
        payload = json.loads(entry["content"])
    except (KeyError, TypeError, ValueError):
        return None
    return payload if isinstance(payload, dict) else None


def successful_tool_results(context: list) -> list[dict]:
    """Every successful tool-result envelope in *context*. Prefers the `meta`
    mirror (cheap, no re-parse) and falls back to parsing `content` for legacy
    entries that predate structured meta."""
    successes: list[dict] = []
    for entry in context:
        if not isinstance(entry, dict) or entry.get("role") != "tool":
            continue
        meta = entry.get("meta")
        if isinstance(meta, dict) and meta.get("type") == TYPE_TOOL_RESULT:
            if meta.get("success"):
                envelope = _parse_tool_envelope(entry) or {
                    "tool": meta.get("tool"),
                    "data": None,
                    "success": True,
                }
                successes.append(envelope)
            continue
        # Legacy entry: no structured meta — parse the content envelope.
        envelope = _parse_tool_envelope(entry)
        if envelope is not None and envelope.get("success"):
            successes.append(envelope)
    return successes


# ---------------------------------------------------------------------------
# Data digestion (bound the size of a single tool-result payload)
# ---------------------------------------------------------------------------


def _digest_data(data: Any) -> Any:
    """Shrink an oversized tool-result `data` payload: keep list counts and a
    few representative ids, drop the full rows. Best-effort — anything we don't
    recognize is replaced with a short marker."""
    if isinstance(data, dict):
        digested: dict[str, Any] = {}
        for key, value in data.items():
            if isinstance(value, list):
                ids = [
                    row.get("listing_id") or row.get("campaign_id")
                    for row in value
                    if isinstance(row, dict)
                ]
                ids = [i for i in ids if i]
                digested[key] = {
                    "_digested": True,
                    "count": len(value),
                    "sample_ids": ids[:5],
                }
            else:
                digested[key] = value
        return digested
    if isinstance(data, list):
        return {"_digested": True, "count": len(data)}
    return data


def _maybe_digest_tool_entry(entry: dict, max_chars: int) -> dict:
    """Return *entry* with its tool-result `data` digested iff the serialized
    envelope exceeds *max_chars*. Non-tool / unparseable entries pass through
    untouched. Never mutates the input."""
    envelope = _parse_tool_envelope(entry)
    if envelope is None:
        return entry
    if len(entry.get("content", "")) <= max_chars:
        return entry
    envelope = dict(envelope)
    envelope["data"] = _digest_data(envelope.get("data"))
    new_entry = copy.deepcopy(entry)
    new_entry["content"] = json.dumps(envelope)
    return new_entry


# ---------------------------------------------------------------------------
# Windowing (what the LLM sees this step)
# ---------------------------------------------------------------------------


def _summarize_older(entries: list[dict]) -> dict:
    """Collapse a run of older entries into one assistant recap entry."""
    lines: list[str] = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        role = entry.get("role")
        meta = entry.get("meta") if isinstance(entry.get("meta"), dict) else {}
        etype = meta.get("type")
        if role == "user":
            lines.append(f"- User asked: {entry.get('content', '')}")
        elif etype == TYPE_TOOL_CALL or entry.get("tool_calls"):
            tool = meta.get("tool") or "tool"
            lines.append(f"- Called {tool}")
        elif role == "tool":
            tool = meta.get("tool") or "tool"
            ok = "ok" if meta.get("success") else "failed"
            lines.append(f"- {tool} → {ok}")
        elif role == "assistant" and entry.get("content"):
            lines.append(f"- Assistant answered: {entry.get('content')}")
    body = "\n".join(lines) if lines else "(no earlier detail)"
    return {
        "role": "assistant",
        "content": f"Summary of earlier conversation:\n{body}",
        "meta": {"type": TYPE_SUMMARY},
    }


def prepare_context(context: list, window: int | None = None, max_data_chars: int | None = None) -> list:
    """Build the message list sent to the LLM: recent entries verbatim, older
    ones collapsed into a single summary recap, oversized payloads digested.

    Pairing is preserved: the kept window never begins with a `tool` entry
    whose assistant `tool_calls` turn has been trimmed off (such orphans are
    folded into the summary instead), so the provider always sees a valid
    call→result sequence.
    """
    window = settings.memory_window_turns if window is None else window
    max_data_chars = settings.memory_max_data_chars if max_data_chars is None else max_data_chars

    digested = [_maybe_digest_tool_entry(e, max_data_chars) if isinstance(e, dict) else e for e in context]

    if len(digested) <= window:
        return digested

    older = digested[:-window]
    recent = digested[-window:]

    # Don't let the window start on an orphan tool result.
    while recent and isinstance(recent[0], dict) and recent[0].get("role") == "tool":
        older.append(recent.pop(0))

    return [_summarize_older(older), *recent]


# ---------------------------------------------------------------------------
# Persist compaction (what gets stored)
# ---------------------------------------------------------------------------


def compact_for_persist(context: list, max_data_chars: int | None = None) -> list:
    """Shape *context* for storage: keep the full conversational thread and
    every tool's audit `meta` (so "which tools / which failed" stays queryable
    via the API), but digest oversized tool-result payloads so the stored blob
    stays bounded regardless of session length."""
    max_data_chars = settings.memory_max_data_chars if max_data_chars is None else max_data_chars
    return [
        _maybe_digest_tool_entry(e, max_data_chars) if isinstance(e, dict) else e for e in context
    ]
