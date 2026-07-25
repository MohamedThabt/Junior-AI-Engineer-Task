"""Shared secret-redaction helpers.

`logging_utils` redacts sensitive argument keys before writing a log line;
the memory layer needs the exact same rule before persisting tool-call args
and tool-result data to the session blob. Both import from here so the two
paths can never drift apart on what counts as "sensitive".
"""

from __future__ import annotations

import re
from typing import Any

# A key is treated as sensitive if its name contains any of these substrings
# (case-insensitive). Value redaction keys off the *field name*, not the value,
# so we never have to inspect (and risk logging) the secret itself.
SENSITIVE_FIELD_PATTERN = re.compile(r"(key|token|secret|password|credential)", re.IGNORECASE)

_REDACTED = "[REDACTED]"


def redact_mapping(args: dict[str, Any] | None) -> dict[str, Any] | None:
    """Return a shallow copy of *args* with sensitively-named keys masked.

    Non-dict input is returned unchanged (callers may hand us `None` or a
    list payload).
    """
    if not isinstance(args, dict):
        return args
    return {
        key: (_REDACTED if SENSITIVE_FIELD_PATTERN.search(str(key)) else value)
        for key, value in args.items()
    }


def redact_deep(value: Any) -> Any:
    """Recursively redact sensitively-named keys anywhere inside *value*.

    Walks nested dicts/lists so a secret buried inside a tool-result `data`
    payload is masked, not just top-level args.
    """
    if isinstance(value, dict):
        return {
            key: (
                _REDACTED
                if SENSITIVE_FIELD_PATTERN.search(str(key))
                else redact_deep(inner)
            )
            for key, inner in value.items()
        }
    if isinstance(value, list):
        return [redact_deep(item) for item in value]
    return value
