"""Pydantic schemas — the single source of truth for both tool input
validation and registry schema generation (``app/tools/registry.py``).

Every tool call is validated against one of the ``*Filters`` / ``*Create`` /
``*Update`` / ``*Delete`` models below *before* any repository code runs.
Every tool (and the ``finalize`` control tool) returns the same
``ToolResult`` envelope regardless of success/failure.
"""

from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

ListingStatus = Literal["Active", "Pending", "Sold"]

_LISTING_ID_PATTERN = r"^LST-\d+$"
_CAMPAIGN_ID_PATTERN = r"^CMP-\d+$"


def _validate_iso_date(value: str, field_name: str) -> str:
    try:
        date.fromisoformat(value)
    except ValueError as exc:
        raise ValueError(f"{field_name} must be an ISO date (YYYY-MM-DD)") from exc
    return value


# ---------------------------------------------------------------------------
# Standard result envelope (all tools, including `finalize`)
# ---------------------------------------------------------------------------


class ToolResult(BaseModel):
    success: bool
    data: dict | list | None
    error: str | None
    tool: str
    attempts: int


# ---------------------------------------------------------------------------
# Real estate ("realstate") tool input models
# ---------------------------------------------------------------------------


class RealEstateFilters(BaseModel):
    """Optional filters for `query_real_estate`."""

    city: str | None = None
    state: str | None = None
    listing_status: ListingStatus | None = None
    min_price: float | None = Field(default=None, ge=0)
    max_price: float | None = Field(default=None, ge=0)
    min_bedrooms: int | None = Field(default=None, ge=0)
    max_bedrooms: int | None = Field(default=None, ge=0)
    min_bathrooms: float | None = Field(default=None, ge=0)
    max_bathrooms: float | None = Field(default=None, ge=0)
    limit: int = Field(default=20, ge=1)

    @model_validator(mode="after")
    def _check_ranges(self) -> "RealEstateFilters":
        pairs = (
            ("min_price", "max_price"),
            ("min_bedrooms", "max_bedrooms"),
            ("min_bathrooms", "max_bathrooms"),
        )
        for low_name, high_name in pairs:
            low, high = getattr(self, low_name), getattr(self, high_name)
            if low is not None and high is not None and low > high:
                raise ValueError(f"{low_name} cannot be greater than {high_name}")
        return self


class RealEstateCreate(BaseModel):
    """All columns for `insert_real_estate` — `listing_id` is always required."""

    listing_id: str = Field(pattern=_LISTING_ID_PATTERN)
    property_type: str
    city: str
    state: str
    bedrooms: int = Field(ge=0)
    bathrooms: float = Field(ge=0)
    square_footage: int = Field(gt=0)
    year_built: int
    list_price: float = Field(ge=0)
    sale_price: float | None = Field(default=None, ge=0)
    listing_status: ListingStatus


class RealEstateUpdate(BaseModel):
    """`listing_id` required (exact PK); at least one other field required."""

    listing_id: str = Field(pattern=_LISTING_ID_PATTERN)
    property_type: str | None = None
    city: str | None = None
    state: str | None = None
    bedrooms: int | None = Field(default=None, ge=0)
    bathrooms: float | None = Field(default=None, ge=0)
    square_footage: int | None = Field(default=None, gt=0)
    year_built: int | None = None
    list_price: float | None = Field(default=None, ge=0)
    sale_price: float | None = Field(default=None, ge=0)
    listing_status: ListingStatus | None = None

    @model_validator(mode="after")
    def _require_at_least_one_change(self) -> "RealEstateUpdate":
        changes = self.model_dump(exclude={"listing_id"}, exclude_none=True)
        if not changes:
            raise ValueError("At least one field to change is required besides listing_id")
        return self


class RealEstateDelete(BaseModel):
    listing_id: str = Field(pattern=_LISTING_ID_PATTERN)


# ---------------------------------------------------------------------------
# Campaign tool input models
# ---------------------------------------------------------------------------


class CampaignFilters(BaseModel):
    """Optional filters for `query_campaigns`."""

    channel: str | None = None
    campaign_name: str | None = None
    start_date_from: str | None = None
    end_date_to: str | None = None
    limit: int = Field(default=20, ge=1)

    @field_validator("start_date_from")
    @classmethod
    def _validate_start_date_from(cls, value: str | None) -> str | None:
        return value if value is None else _validate_iso_date(value, "start_date_from")

    @field_validator("end_date_to")
    @classmethod
    def _validate_end_date_to(cls, value: str | None) -> str | None:
        return value if value is None else _validate_iso_date(value, "end_date_to")


class CampaignCreate(BaseModel):
    """All columns for `insert_campaign` — `campaign_id` is always required."""

    campaign_id: str = Field(pattern=_CAMPAIGN_ID_PATTERN)
    campaign_name: str
    channel: str
    start_date: str
    end_date: str
    budget_allocated: float = Field(ge=0)
    amount_spent: float = Field(ge=0)
    impressions: int = Field(ge=0)
    clicks: int = Field(ge=0)
    conversions: int = Field(ge=0)
    revenue_generated: float = Field(ge=0)

    @field_validator("start_date")
    @classmethod
    def _validate_start_date(cls, value: str) -> str:
        return _validate_iso_date(value, "start_date")

    @field_validator("end_date")
    @classmethod
    def _validate_end_date(cls, value: str) -> str:
        return _validate_iso_date(value, "end_date")


class CampaignUpdate(BaseModel):
    """`campaign_id` required (exact PK); at least one other field required."""

    campaign_id: str = Field(pattern=_CAMPAIGN_ID_PATTERN)
    campaign_name: str | None = None
    channel: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    budget_allocated: float | None = Field(default=None, ge=0)
    amount_spent: float | None = Field(default=None, ge=0)
    impressions: int | None = Field(default=None, ge=0)
    clicks: int | None = Field(default=None, ge=0)
    conversions: int | None = Field(default=None, ge=0)
    revenue_generated: float | None = Field(default=None, ge=0)

    @field_validator("start_date")
    @classmethod
    def _validate_start_date(cls, value: str | None) -> str | None:
        return value if value is None else _validate_iso_date(value, "start_date")

    @field_validator("end_date")
    @classmethod
    def _validate_end_date(cls, value: str | None) -> str | None:
        return value if value is None else _validate_iso_date(value, "end_date")

    @model_validator(mode="after")
    def _require_at_least_one_change(self) -> "CampaignUpdate":
        changes = self.model_dump(exclude={"campaign_id"}, exclude_none=True)
        if not changes:
            raise ValueError("At least one field to change is required besides campaign_id")
        return self


class CampaignDelete(BaseModel):
    campaign_id: str = Field(pattern=_CAMPAIGN_ID_PATTERN)


# ---------------------------------------------------------------------------
# Control tool
# ---------------------------------------------------------------------------


class FinalizeInput(BaseModel):
    """Input for the `finalize` control tool — the LLM's final answer."""

    answer: str = Field(min_length=1)


# ---------------------------------------------------------------------------
# Session model
# ---------------------------------------------------------------------------


class ChatSession(BaseModel):
    session_id: str
    session_name: str
    context: list
    created_at: str
    updated_at: str
