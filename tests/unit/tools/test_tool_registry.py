"""Unit tests for `app/tools/registry.py`."""

import pytest

from app.tools.registry import TOOL_REGISTRY, TOOL_SCHEMAS

_EXPECTED_TOOL_NAMES = {
    "query_real_estate",
    "insert_real_estate",
    "update_real_estate",
    "delete_real_estate",
    "query_campaigns",
    "insert_campaign",
    "update_campaign",
    "delete_campaign",
    "finalize",
}


class TestToolRegistry:
    def test_has_exactly_nine_entries(self):
        assert len(TOOL_REGISTRY) == 9

    def test_entries_match_the_expected_tool_names(self):
        assert set(TOOL_REGISTRY.keys()) == _EXPECTED_TOOL_NAMES

    def test_every_entry_is_callable(self):
        for name, fn in TOOL_REGISTRY.items():
            assert callable(fn), f"{name} is not callable"


class TestToolSchemas:
    def test_has_exactly_nine_schemas(self):
        assert len(TOOL_SCHEMAS) == 9

    def test_every_registry_name_has_a_matching_schema(self):
        schema_names = {schema["name"] for schema in TOOL_SCHEMAS}
        assert schema_names == set(TOOL_REGISTRY.keys())

    def test_every_schema_is_well_formed(self):
        for schema in TOOL_SCHEMAS:
            assert isinstance(schema["name"], str) and schema["name"]
            assert isinstance(schema["description"], str) and schema["description"]
            parameters = schema["parameters"]
            assert isinstance(parameters, dict)
            assert parameters.get("type") == "object"
            assert "properties" in parameters

    def test_numeric_optional_params_also_accept_a_string(self):
        """Regression test: Groq's tool-call validator rejected a real
        request with `max_price: "400000"` (string) because the advertised
        schema only allowed `number`/`null`, even though Pydantic itself
        coerces that string to a float without issue."""
        by_name = {schema["name"]: schema for schema in TOOL_SCHEMAS}
        max_price_schema = by_name["query_real_estate"]["parameters"]["properties"]["max_price"]

        branch_types = {branch.get("type") for branch in max_price_schema["anyOf"]}

        assert "number" in branch_types
        assert "string" in branch_types

    def test_numeric_required_params_also_accept_a_string(self):
        by_name = {schema["name"]: schema for schema in TOOL_SCHEMAS}
        bedrooms_schema = by_name["insert_real_estate"]["parameters"]["properties"]["bedrooms"]

        branch_types = {branch.get("type") for branch in bedrooms_schema["anyOf"]}

        assert "integer" in branch_types
        assert "string" in branch_types

    def test_write_schemas_require_exact_primary_key(self):
        by_name = {schema["name"]: schema for schema in TOOL_SCHEMAS}

        for tool_name, id_field in (
            ("update_real_estate", "listing_id"),
            ("delete_real_estate", "listing_id"),
            ("update_campaign", "campaign_id"),
            ("delete_campaign", "campaign_id"),
        ):
            parameters = by_name[tool_name]["parameters"]
            assert id_field in parameters["required"]


class TestRegistryDispatch:
    """Dispatching through `TOOL_REGISTRY` by name reaches the real tool
    implementation (not just a callable placeholder) end-to-end."""

    def test_dispatching_query_real_estate_by_name_reaches_the_real_tool(self, db_conn):
        db_conn.execute(
            "INSERT INTO real_estate_listings "
            "(listing_id, property_type, city, state, bedrooms, bathrooms, "
            "square_footage, year_built, list_price, sale_price, listing_status) "
            "VALUES ('LST-9500', 'House', 'Austin', 'Texas', 3, 2.0, 1800, 2010, "
            "300000.0, NULL, 'Active')"
        )
        db_conn.commit()

        result = TOOL_REGISTRY["query_real_estate"]({"city": "Austin"})

        assert result.success is True
        assert result.tool == "query_real_estate"
        assert result.data["count"] == 1

    def test_dispatching_query_campaigns_by_name_reaches_the_real_tool(self, db_conn):
        db_conn.execute(
            "INSERT INTO marketing_campaigns "
            "(campaign_id, campaign_name, channel, start_date, end_date, "
            "budget_allocated, amount_spent, impressions, clicks, conversions, revenue_generated) "
            "VALUES ('CMP-9500', 'Registry Test', 'Facebook', '2025-01-01', '2025-02-01', "
            "1000.0, 900.0, 1000, 100, 10, 500.0)"
        )
        db_conn.commit()

        result = TOOL_REGISTRY["query_campaigns"]({"channel": "Facebook"})

        assert result.success is True
        assert result.tool == "query_campaigns"
        assert result.data["count"] == 1

    def test_dispatching_finalize_by_name_raises_not_implemented(self):
        with pytest.raises(NotImplementedError):
            TOOL_REGISTRY["finalize"]({"answer": "done"})
