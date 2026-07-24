"""Unit tests for `app/tools/real_estate_tools.py` — every tool is called
standalone here, with zero agent/executor code involved."""

from unittest.mock import MagicMock

from app.tools.real_estate_tools import (
    MAX_QUERY_LIMIT,
    delete_real_estate,
    insert_real_estate,
    query_real_estate,
    update_real_estate,
)
from tests.conftest import SAMPLE_LISTING, insert_sample_listing


class TestQueryRealEstate:
    def test_returns_matching_rows(self, db_conn):
        insert_sample_listing(db_conn)
        insert_sample_listing(db_conn, {"listing_id": "LST-9002", "city": "Dallas"})
        result = query_real_estate({"city": "Austin"})
        assert result.success is True
        assert result.data["count"] == 1
        assert result.attempts == 1

    def test_retries_once_after_a_transient_failure_then_succeeds(self, monkeypatch):
        mock_query = MagicMock(
            side_effect=[Exception("database is locked"), [{"listing_id": "LST-9001"}]]
        )
        monkeypatch.setattr("app.tools.real_estate_tools.RealEstateRepository.query", mock_query)

        result = query_real_estate({"city": "Austin"})

        assert result.success is True
        assert result.attempts == 2
        assert mock_query.call_count == 2

    def test_caps_limit_at_50_regardless_of_requested_value(self, db_conn):
        for i in range(55):
            insert_sample_listing(db_conn, {"listing_id": f"LST-9{i:03d}"})
        result = query_real_estate({"limit": 1000})
        assert result.success is True
        assert result.data["count"] == MAX_QUERY_LIMIT

    def test_invalid_filters_rejected_without_touching_repository(self, monkeypatch):
        mock_query = MagicMock(side_effect=AssertionError("repository should not be called"))
        monkeypatch.setattr("app.tools.real_estate_tools.RealEstateRepository.query", mock_query)

        result = query_real_estate({"limit": -1})

        assert result.success is False
        assert result.attempts == 0
        mock_query.assert_not_called()


class TestInsertRealEstate:
    def test_insert_success(self, db_conn):
        result = insert_real_estate({**SAMPLE_LISTING})
        assert result.success is True
        assert result.data["listing_id"] == "LST-9001"
        assert result.attempts == 1

    def test_insert_duplicate_id_fails_naming_the_tool(self, db_conn):
        insert_sample_listing(db_conn)
        result = insert_real_estate({**SAMPLE_LISTING})
        assert result.success is False
        assert "insert_real_estate" in result.error
        assert "LST-9001" in result.error
        assert result.attempts == 2

    def test_invalid_payload_rejected_without_touching_repository(self, monkeypatch):
        mock_insert = MagicMock(side_effect=AssertionError("repository should not be called"))
        monkeypatch.setattr("app.tools.real_estate_tools.RealEstateRepository.insert", mock_insert)

        result = insert_real_estate({"listing_id": "not-a-valid-id"})

        assert result.success is False
        assert result.attempts == 0
        mock_insert.assert_not_called()

    def test_retries_once_after_a_transient_failure_then_succeeds(self, monkeypatch):
        monkeypatch.setattr(
            "app.tools.real_estate_tools.RealEstateRepository.exists", MagicMock(return_value=False)
        )
        mock_insert = MagicMock(side_effect=[Exception("database is locked"), {**SAMPLE_LISTING}])
        monkeypatch.setattr("app.tools.real_estate_tools.RealEstateRepository.insert", mock_insert)

        result = insert_real_estate({**SAMPLE_LISTING})

        assert result.success is True
        assert result.attempts == 2
        assert mock_insert.call_count == 2


class TestUpdateRealEstate:
    def test_update_success(self, db_conn):
        insert_sample_listing(db_conn)
        result = update_real_estate({"listing_id": "LST-9001", "listing_status": "Sold"})
        assert result.success is True
        assert result.data["listing_status"] == "Sold"
        assert result.attempts == 1

    def test_update_missing_id_fails_naming_the_tool(self, db_conn):
        result = update_real_estate({"listing_id": "LST-0000", "listing_status": "Sold"})
        assert result.success is False
        assert "update_real_estate" in result.error
        assert "LST-0000" in result.error
        assert result.attempts == 2

    def test_update_requires_at_least_one_field_besides_id(self, monkeypatch):
        mock_update = MagicMock(side_effect=AssertionError("repository should not be called"))
        monkeypatch.setattr("app.tools.real_estate_tools.RealEstateRepository.update", mock_update)

        result = update_real_estate({"listing_id": "LST-9001"})

        assert result.success is False
        assert result.attempts == 0
        mock_update.assert_not_called()

    def test_retries_once_after_a_transient_failure_then_succeeds(self, monkeypatch):
        monkeypatch.setattr(
            "app.tools.real_estate_tools.RealEstateRepository.exists", MagicMock(return_value=True)
        )
        mock_update = MagicMock(
            side_effect=[Exception("database is locked"), {**SAMPLE_LISTING, "listing_status": "Sold"}]
        )
        monkeypatch.setattr("app.tools.real_estate_tools.RealEstateRepository.update", mock_update)

        result = update_real_estate({"listing_id": "LST-9001", "listing_status": "Sold"})

        assert result.success is True
        assert result.attempts == 2
        assert mock_query_count := mock_update.call_count == 2


class TestDeleteRealEstate:
    def test_delete_success(self, db_conn):
        insert_sample_listing(db_conn)
        result = delete_real_estate({"listing_id": "LST-9001"})
        assert result.success is True
        assert result.data == {"listing_id": "LST-9001", "deleted": True}
        assert result.attempts == 1

    def test_delete_missing_id_fails_naming_the_tool(self, db_conn):
        result = delete_real_estate({"listing_id": "LST-0000"})
        assert result.success is False
        assert "delete_real_estate" in result.error
        assert "LST-0000" in result.error
        assert result.attempts == 2

    def test_delete_never_accepts_a_filter(self, monkeypatch):
        mock_delete = MagicMock(side_effect=AssertionError("repository should not be called"))
        monkeypatch.setattr("app.tools.real_estate_tools.RealEstateRepository.delete", mock_delete)

        result = delete_real_estate({"state": "Texas"})

        assert result.success is False
        assert result.attempts == 0
        mock_delete.assert_not_called()

    def test_retries_once_after_a_transient_failure_then_succeeds(self, monkeypatch):
        monkeypatch.setattr(
            "app.tools.real_estate_tools.RealEstateRepository.exists", MagicMock(return_value=True)
        )
        mock_delete = MagicMock(side_effect=[Exception("database is locked"), None])
        monkeypatch.setattr("app.tools.real_estate_tools.RealEstateRepository.delete", mock_delete)

        result = delete_real_estate({"listing_id": "LST-9001"})

        assert result.success is True
        assert result.attempts == 2
        assert mock_delete.call_count == 2
