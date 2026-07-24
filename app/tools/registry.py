"""Tool registry & function-calling schemas.

`TOOL_REGISTRY` is the single lookup the future executor (issue #13, out of
scope here) uses — tools are never imported/called directly anywhere else.
`TOOL_SCHEMAS` is what gets passed to the LLM for function-calling; every
parameter schema is derived from the matching Pydantic model in
`app/models/schemas.py` (via `model_json_schema()`) so the validation rules
and the LLM-facing schema can never drift apart.
"""

from __future__ import annotations

from typing import Any, Callable

from app.models.schemas import (
    CampaignCreate,
    CampaignDelete,
    CampaignFilters,
    CampaignUpdate,
    FinalizeInput,
    RealEstateCreate,
    RealEstateDelete,
    RealEstateFilters,
    RealEstateUpdate,
)
from app.tools.campaigns_tools import (
    delete_campaign,
    insert_campaign,
    query_campaigns,
    update_campaign,
)
from app.tools.finalize_tool import FINALIZE_DESCRIPTION, FINALIZE_TOOL_NAME
from app.tools.real_estate_tools import (
    delete_real_estate,
    insert_real_estate,
    query_real_estate,
    update_real_estate,
)


def _finalize_not_implemented(args: dict, **_kwargs: Any) -> None:
    """Placeholder registered under `finalize` so the registry has all 9
    entries. Real execution (`run_finalize`/`forced_finalize`) lives in
    `app/agent/finalize.py` (issue #12), which is out of scope here — the
    loop controller/executor call that module directly rather than going
    through this registry entry."""
    raise NotImplementedError(
        "finalize execution lives in app/agent/finalize.py (issue #12), not the registry"
    )


# (tool name, callable, input model, one-line action-oriented description)
_TOOL_DEFINITIONS: list[tuple[str, Callable[..., Any], type, str]] = [
    (
        "query_real_estate",
        query_real_estate,
        RealEstateFilters,
        "Query real estate listings with optional filters (city, state, status, "
        "price range, beds/baths range); returns at most 50 rows.",
    ),
    (
        "insert_real_estate",
        insert_real_estate,
        RealEstateCreate,
        "Insert a new real estate listing. Requires an explicit listing_id "
        "that does not already exist.",
    ),
    (
        "update_real_estate",
        update_real_estate,
        RealEstateUpdate,
        "Update one or more fields on an existing real estate listing, "
        "identified by its exact listing_id.",
    ),
    (
        "delete_real_estate",
        delete_real_estate,
        RealEstateDelete,
        "Delete a real estate listing, identified by its exact listing_id.",
    ),
    (
        "query_campaigns",
        query_campaigns,
        CampaignFilters,
        "Query marketing campaigns with optional filters (channel, campaign "
        "name, date range); returns at most 50 rows.",
    ),
    (
        "insert_campaign",
        insert_campaign,
        CampaignCreate,
        "Insert a new marketing campaign. Requires an explicit campaign_id "
        "that does not already exist.",
    ),
    (
        "update_campaign",
        update_campaign,
        CampaignUpdate,
        "Update one or more fields on an existing marketing campaign, "
        "identified by its exact campaign_id.",
    ),
    (
        "delete_campaign",
        delete_campaign,
        CampaignDelete,
        "Delete a marketing campaign, identified by its exact campaign_id.",
    ),
    (
        FINALIZE_TOOL_NAME,
        _finalize_not_implemented,
        FinalizeInput,
        FINALIZE_DESCRIPTION,
    ),
]

TOOL_REGISTRY: dict[str, Callable[..., Any]] = {
    name: fn for name, fn, _model, _description in _TOOL_DEFINITIONS
}

TOOL_SCHEMAS: list[dict] = [
    {
        "name": name,
        "description": description,
        "parameters": model.model_json_schema(),
    }
    for name, _fn, model, description in _TOOL_DEFINITIONS
]
