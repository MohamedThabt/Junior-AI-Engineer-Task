"""LLM-callable tools for the ``marketing_campaigns`` table.

Each tool validates its own input (Pydantic), delegates the actual DB
operation to `CampaignRepository`, retries the whole check+write operation
up to `MAX_ATTEMPTS` times via `run_with_retry`, and always returns the
standard `ToolResult` envelope — never a raw value or a bare exception. No
tool here contains SQL or reasons about user intent; an ambiguous/invalid
argument is rejected, never guessed at.
"""

from __future__ import annotations

from pydantic import ValidationError

from app.models.schemas import (
    CampaignCreate,
    CampaignDelete,
    CampaignFilters,
    CampaignUpdate,
    ToolResult,
)
from app.repositories.campaign_repository import CampaignRepository
from app.utilities.logging_utils import new_request_id
from app.utilities.tool_execution import (
    format_validation_error,
    make_attempt_logger,
    run_with_retry,
)

MAX_ATTEMPTS = 2
MAX_QUERY_LIMIT = 50


def query_campaigns(
    args: dict, *, request_id: str | None = None, step_number: int = 0
) -> ToolResult:
    """Read campaigns matching optional filters (`limit` capped at 50)."""
    tool_name = "query_campaigns"
    request_id = request_id or new_request_id()

    try:
        filters = CampaignFilters.model_validate(args)
    except ValidationError as exc:
        return ToolResult(
            success=False,
            data=None,
            error=f"{tool_name}: invalid arguments: {format_validation_error(exc)}",
            tool=tool_name,
            attempts=0,
        )

    limit = min(filters.limit, MAX_QUERY_LIMIT)
    filter_dict = filters.model_dump(exclude={"limit"}, exclude_none=True)

    def _operation() -> list[dict]:
        return CampaignRepository.query(filter_dict, limit)

    try:
        rows, attempts = run_with_retry(
            _operation,
            max_attempts=MAX_ATTEMPTS,
            on_attempt=make_attempt_logger(tool_name, request_id, step_number, args),
        )
    except Exception as exc:
        return ToolResult(
            success=False,
            data=None,
            error=f"{tool_name} failed after {MAX_ATTEMPTS} attempts: {exc}",
            tool=tool_name,
            attempts=MAX_ATTEMPTS,
        )

    return ToolResult(
        success=True,
        data={"campaigns": rows, "count": len(rows)},
        error=None,
        tool=tool_name,
        attempts=attempts,
    )


def insert_campaign(
    args: dict, *, request_id: str | None = None, step_number: int = 0
) -> ToolResult:
    """Create a campaign. `campaign_id` is required and must not already exist."""
    tool_name = "insert_campaign"
    request_id = request_id or new_request_id()

    try:
        payload = CampaignCreate.model_validate(args)
    except ValidationError as exc:
        return ToolResult(
            success=False,
            data=None,
            error=f"{tool_name}: invalid arguments: {format_validation_error(exc)}",
            tool=tool_name,
            attempts=0,
        )

    def _operation() -> dict:
        if CampaignRepository.exists(payload.campaign_id):
            raise ValueError(f"campaign_id '{payload.campaign_id}' already exists")
        return CampaignRepository.insert(payload.model_dump())

    try:
        row, attempts = run_with_retry(
            _operation,
            max_attempts=MAX_ATTEMPTS,
            on_attempt=make_attempt_logger(tool_name, request_id, step_number, args),
        )
    except Exception as exc:
        return ToolResult(
            success=False,
            data=None,
            error=f"{tool_name} failed after {MAX_ATTEMPTS} attempts: {exc}",
            tool=tool_name,
            attempts=MAX_ATTEMPTS,
        )

    return ToolResult(success=True, data=row, error=None, tool=tool_name, attempts=attempts)


def update_campaign(
    args: dict, *, request_id: str | None = None, step_number: int = 0
) -> ToolResult:
    """Update an existing campaign. Targets an exact `campaign_id` only, never a filter."""
    tool_name = "update_campaign"
    request_id = request_id or new_request_id()

    try:
        payload = CampaignUpdate.model_validate(args)
    except ValidationError as exc:
        return ToolResult(
            success=False,
            data=None,
            error=f"{tool_name}: invalid arguments: {format_validation_error(exc)}",
            tool=tool_name,
            attempts=0,
        )

    fields = payload.model_dump(exclude={"campaign_id"}, exclude_none=True)

    def _operation() -> dict:
        if not CampaignRepository.exists(payload.campaign_id):
            raise ValueError(f"campaign_id '{payload.campaign_id}' not found")
        return CampaignRepository.update(payload.campaign_id, fields)

    try:
        row, attempts = run_with_retry(
            _operation,
            max_attempts=MAX_ATTEMPTS,
            on_attempt=make_attempt_logger(tool_name, request_id, step_number, args),
        )
    except Exception as exc:
        return ToolResult(
            success=False,
            data=None,
            error=f"{tool_name} failed after {MAX_ATTEMPTS} attempts: {exc}",
            tool=tool_name,
            attempts=MAX_ATTEMPTS,
        )

    return ToolResult(success=True, data=row, error=None, tool=tool_name, attempts=attempts)


def delete_campaign(
    args: dict, *, request_id: str | None = None, step_number: int = 0
) -> ToolResult:
    """Delete an existing campaign. Targets an exact `campaign_id` only, never a filter."""
    tool_name = "delete_campaign"
    request_id = request_id or new_request_id()

    try:
        payload = CampaignDelete.model_validate(args)
    except ValidationError as exc:
        return ToolResult(
            success=False,
            data=None,
            error=f"{tool_name}: invalid arguments: {format_validation_error(exc)}",
            tool=tool_name,
            attempts=0,
        )

    def _operation() -> dict:
        if not CampaignRepository.exists(payload.campaign_id):
            raise ValueError(f"campaign_id '{payload.campaign_id}' not found")
        CampaignRepository.delete(payload.campaign_id)
        return {"campaign_id": payload.campaign_id, "deleted": True}

    try:
        data, attempts = run_with_retry(
            _operation,
            max_attempts=MAX_ATTEMPTS,
            on_attempt=make_attempt_logger(tool_name, request_id, step_number, args),
        )
    except Exception as exc:
        return ToolResult(
            success=False,
            data=None,
            error=f"{tool_name} failed after {MAX_ATTEMPTS} attempts: {exc}",
            tool=tool_name,
            attempts=MAX_ATTEMPTS,
        )

    return ToolResult(success=True, data=data, error=None, tool=tool_name, attempts=attempts)
