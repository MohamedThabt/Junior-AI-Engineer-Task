"""Function-calling schema for the `finalize` control tool.

Schema only — execution logic (the actual loop-exit path: `run_finalize`,
`forced_finalize`, `graceful_fallback`) lives in `app/agent/finalize.py`
(issue #12), which is out of scope for this work. Defining the schema here
lets the 9-tool registry (`app/tools/registry.py`) be complete without that
execution logic existing yet.
"""

from __future__ import annotations

from app.models.schemas import FinalizeInput

FINALIZE_TOOL_NAME = "finalize"
FINALIZE_DESCRIPTION = (
    "Signal that you have enough information and provide the final "
    "natural-language answer to the user. Calling this ends the loop."
)


def finalize_schema() -> dict:
    """Function-calling schema for `finalize`, derived from `FinalizeInput`."""
    return {
        "name": FINALIZE_TOOL_NAME,
        "description": FINALIZE_DESCRIPTION,
        "parameters": FinalizeInput.model_json_schema(),
    }
