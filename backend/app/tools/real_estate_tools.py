"""LLM-callable tools for the ``real_estate_listings`` table.

Each tool validates its own input (Pydantic), delegates the actual DB
operation to `RealEstateRepository`, retries the whole check+write
operation up to `MAX_ATTEMPTS` times via `run_with_retry`, and always
returns the standard `ToolResult` envelope — never a raw value or a bare
exception. No tool here contains SQL or reasons about user intent; an
ambiguous/invalid argument is rejected, never guessed at.
"""

from __future__ import annotations

from pydantic import ValidationError

from app.models.schemas import (
    RealEstateCreate,
    RealEstateDelete,
    RealEstateFilters,
    RealEstateUpdate,
    ToolResult,
)
from app.repositories.real_estate_repository import RealEstateRepository
from app.utilities.logging_utils import new_request_id
from app.utilities.tool_execution import (
    format_validation_error,
    make_attempt_logger,
    run_with_retry,
)

MAX_ATTEMPTS = 2
MAX_QUERY_LIMIT = 50


def query_real_estate(
    args: dict, *, request_id: str | None = None, step_number: int = 0
) -> ToolResult:
    """Read listings matching optional filters (`limit` capped at 50)."""
    tool_name = "query_real_estate"
    request_id = request_id or new_request_id()

    try:
        filters = RealEstateFilters.model_validate(args)
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
        return RealEstateRepository.query(filter_dict, limit)

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
        data={"listings": rows, "count": len(rows)},
        error=None,
        tool=tool_name,
        attempts=attempts,
    )


def insert_real_estate(
    args: dict, *, request_id: str | None = None, step_number: int = 0
) -> ToolResult:
    """Create a listing. `listing_id` is required and must not already exist."""
    tool_name = "insert_real_estate"
    request_id = request_id or new_request_id()

    try:
        payload = RealEstateCreate.model_validate(args)
    except ValidationError as exc:
        return ToolResult(
            success=False,
            data=None,
            error=f"{tool_name}: invalid arguments: {format_validation_error(exc)}",
            tool=tool_name,
            attempts=0,
        )

    def _operation() -> dict:
        if RealEstateRepository.exists(payload.listing_id):
            raise ValueError(f"listing_id '{payload.listing_id}' already exists")
        return RealEstateRepository.insert(payload.model_dump())

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


def update_real_estate(
    args: dict, *, request_id: str | None = None, step_number: int = 0
) -> ToolResult:
    """Update an existing listing. Targets an exact `listing_id` only, never a filter."""
    tool_name = "update_real_estate"
    request_id = request_id or new_request_id()

    try:
        payload = RealEstateUpdate.model_validate(args)
    except ValidationError as exc:
        return ToolResult(
            success=False,
            data=None,
            error=f"{tool_name}: invalid arguments: {format_validation_error(exc)}",
            tool=tool_name,
            attempts=0,
        )

    fields = payload.model_dump(exclude={"listing_id"}, exclude_none=True)

    def _operation() -> dict:
        if not RealEstateRepository.exists(payload.listing_id):
            raise ValueError(f"listing_id '{payload.listing_id}' not found")
        return RealEstateRepository.update(payload.listing_id, fields)

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


def delete_real_estate(
    args: dict, *, request_id: str | None = None, step_number: int = 0
) -> ToolResult:
    """Delete an existing listing. Targets an exact `listing_id` only, never a filter."""
    tool_name = "delete_real_estate"
    request_id = request_id or new_request_id()

    try:
        payload = RealEstateDelete.model_validate(args)
    except ValidationError as exc:
        return ToolResult(
            success=False,
            data=None,
            error=f"{tool_name}: invalid arguments: {format_validation_error(exc)}",
            tool=tool_name,
            attempts=0,
        )

    def _operation() -> dict:
        if not RealEstateRepository.exists(payload.listing_id):
            raise ValueError(f"listing_id '{payload.listing_id}' not found")
        RealEstateRepository.delete(payload.listing_id)
        return {"listing_id": payload.listing_id, "deleted": True}

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
