"""Regex-based PII/secret scanning utility (`docs/agent-architecture.md` §0).

Reusable anywhere in the app — not agent-specific. The consumer contract
(reject with HTTP 400 + a generic message, log a distinct security-event
line with the pattern type only) lives in `AgentController` (issue #16, out
of scope here); this module only ever returns the matched *pattern type*,
never the matched value itself, so a caller can't accidentally leak the
secret into a response or a log line even if it wanted to.
"""

from __future__ import annotations

import re

# Compiled once at import time. Checked in this order — first match wins.
# `api_key` is checked first so a long secret embedded elsewhere in the text
# (e.g. next to an email) is still classified as a secret, not shadowed by a
# looser pattern later in the list.
_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    (
        "api_key",
        re.compile(
            r"\bsk-[A-Za-z0-9_-]{16,}\b"
            r"|(?<![A-Za-z0-9+/=])[A-Za-z0-9+/=]{32,}(?![A-Za-z0-9+/=])",
            re.IGNORECASE,
        ),
    ),
    (
        "email",
        re.compile(
            r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
            re.IGNORECASE,
        ),
    ),
    (
        "phone",
        re.compile(
            r"(?<!\d)(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}(?!\d)"
        ),
    ),
    (
        "credit_card",
        re.compile(r"(?<!\d)(?:\d[ -]?){13,16}(?!\d)"),
    ),
]


def scan_for_sensitive_data(text: str) -> str | None:
    """Return the matched pattern type (`"api_key"`, `"email"`, `"phone"`,
    `"credit_card"`) for the first pattern that matches `text`, or `None` if
    no pattern matches. Never returns or logs the matched value itself."""
    for pattern_type, pattern in _PATTERNS:
        if pattern.search(text):
            return pattern_type
    return None
