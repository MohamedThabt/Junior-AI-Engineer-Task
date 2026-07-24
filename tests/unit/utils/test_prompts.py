"""Tests for `app/agent/prompts.py` — system prompt template."""

from app.agent.prompts import build_system_prompt

REAL_ESTATE_COLUMNS = [
    "listing_id",
    "property_type",
    "city",
    "state",
    "bedrooms",
    "bathrooms",
    "square_footage",
    "year_built",
    "list_price",
    "sale_price",
    "listing_status",
]

CAMPAIGN_COLUMNS = [
    "campaign_id",
    "campaign_name",
    "channel",
    "start_date",
    "end_date",
    "budget_allocated",
    "amount_spent",
    "impressions",
    "clicks",
    "conversions",
    "revenue_generated",
]


def test_build_system_prompt_interpolates_max_steps():
    maxSteps = 5

    prompt = build_system_prompt(maxSteps)

    assert "maximum of 5 tool-call steps" in prompt
    assert "{max_steps}" not in prompt


def test_build_system_prompt_interpolates_a_different_max_steps_value():
    maxSteps = 3

    prompt = build_system_prompt(maxSteps)

    assert "maximum of 3 tool-call steps" in prompt
    assert "{max_steps}" not in prompt


def test_build_system_prompt_contains_role_framing_and_no_other_data_sources():
    prompt = build_system_prompt(max_steps=5)

    assert "data assistant for a real estate and marketing analytics system" in prompt
    assert "NO other data sources" in prompt


def test_build_system_prompt_contains_full_real_estate_listings_schema():
    prompt = build_system_prompt(max_steps=5)

    assert "real_estate_listings" in prompt
    for column in REAL_ESTATE_COLUMNS:
        assert column in prompt


def test_build_system_prompt_contains_full_marketing_campaigns_schema():
    prompt = build_system_prompt(max_steps=5)

    assert "marketing_campaigns" in prompt
    for column in CAMPAIGN_COLUMNS:
        assert column in prompt


def test_build_system_prompt_contains_tools_summary_line():
    prompt = build_system_prompt(max_steps=5)

    assert "read/insert/update/delete tools for each table" in prompt
    assert "finalize" in prompt


def test_build_system_prompt_contains_all_five_rules():
    prompt = build_system_prompt(max_steps=5)

    assert "maximum of 5 tool-call steps" in prompt
    assert "call `finalize`" in prompt
    assert "exact listing_id or" in prompt
    assert "Do not blindly repeat the exact same call" in prompt
    assert "Never fabricate data" in prompt


def test_build_system_prompt_contains_security_guardrail_section():
    prompt = build_system_prompt(max_steps=5)

    assert "## Security" in prompt
    assert "API key" in prompt
    assert "credit card number" in prompt
    assert "never repeat," in prompt
    assert "decline via" in prompt
