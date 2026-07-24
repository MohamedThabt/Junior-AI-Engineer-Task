"""Unit tests for `app/tools/campaigns_tools.py` — every tool is called
standalone here, with zero agent/executor code involved."""

from unittest.mock import MagicMock

from app.tools.campaigns_tools import (
    MAX_QUERY_LIMIT,
    delete_campaign,
    insert_campaign,
    query_campaigns,
    update_campaign,
)

_SAMPLE_CAMPAIGN = {
    "campaign_id": "CMP-9001",
    "campaign_name": "Test Campaign",
    "channel": "Facebook",
    "start_date": "2025-04-11",
    "end_date": "2025-05-08",
    "budget_allocated": 25000.0,
    "amount_spent": 23697.26,
    "impressions": 5058725,
    "clicks": 248564,
    "conversions": 13472,
    "revenue_generated": 67314.37,
}


def _insert_sample(db_conn, overrides: dict | None = None):
    data = {**_SAMPLE_CAMPAIGN, **(overrides or {})}
    cols = ", ".join(data.keys())
    placeholders = ", ".join("?" for _ in data)
    db_conn.execute(
        f"INSERT INTO marketing_campaigns ({cols}) VALUES ({placeholders})",
        list(data.values()),
    )
    db_conn.commit()


class TestQueryCampaigns:
    def test_returns_matching_rows(self, db_conn):
        _insert_sample(db_conn)
        _insert_sample(db_conn, {"campaign_id": "CMP-9002", "channel": "LinkedIn"})
        result = query_campaigns({"channel": "Facebook"})
        assert result.success is True
        assert result.data["count"] == 1
        assert result.attempts == 1

    def test_retries_once_after_a_transient_failure_then_succeeds(self, monkeypatch):
        mock_query = MagicMock(
            side_effect=[Exception("database is locked"), [{"campaign_id": "CMP-9001"}]]
        )
        monkeypatch.setattr("app.tools.campaigns_tools.CampaignRepository.query", mock_query)

        result = query_campaigns({"channel": "Facebook"})

        assert result.success is True
        assert result.attempts == 2
        assert mock_query.call_count == 2

    def test_caps_limit_at_50_regardless_of_requested_value(self, db_conn):
        for i in range(55):
            _insert_sample(db_conn, {"campaign_id": f"CMP-9{i:03d}"})
        result = query_campaigns({"limit": 1000})
        assert result.success is True
        assert result.data["count"] == MAX_QUERY_LIMIT

    def test_date_range_filter_validates_iso_format(self, monkeypatch):
        mock_query = MagicMock(side_effect=AssertionError("repository should not be called"))
        monkeypatch.setattr("app.tools.campaigns_tools.CampaignRepository.query", mock_query)

        result = query_campaigns({"start_date_from": "04/11/2025"})

        assert result.success is False
        assert result.attempts == 0
        mock_query.assert_not_called()

    def test_valid_date_range_filter_is_accepted(self, db_conn):
        _insert_sample(db_conn)
        result = query_campaigns({"start_date_from": "2025-01-01", "end_date_to": "2025-12-31"})
        assert result.success is True
        assert result.data["count"] == 1

    def test_invalid_filters_rejected_without_touching_repository(self, monkeypatch):
        mock_query = MagicMock(side_effect=AssertionError("repository should not be called"))
        monkeypatch.setattr("app.tools.campaigns_tools.CampaignRepository.query", mock_query)

        result = query_campaigns({"limit": -1})

        assert result.success is False
        assert result.attempts == 0
        mock_query.assert_not_called()


class TestInsertCampaign:
    def test_insert_success(self, db_conn):
        result = insert_campaign({**_SAMPLE_CAMPAIGN})
        assert result.success is True
        assert result.data["campaign_id"] == "CMP-9001"
        assert result.attempts == 1

    def test_insert_duplicate_id_fails_naming_the_tool(self, db_conn):
        _insert_sample(db_conn)
        result = insert_campaign({**_SAMPLE_CAMPAIGN})
        assert result.success is False
        assert "insert_campaign" in result.error
        assert "CMP-9001" in result.error
        assert result.attempts == 2

    def test_invalid_payload_rejected_without_touching_repository(self, monkeypatch):
        mock_insert = MagicMock(side_effect=AssertionError("repository should not be called"))
        monkeypatch.setattr("app.tools.campaigns_tools.CampaignRepository.insert", mock_insert)

        result = insert_campaign({"campaign_id": "not-a-valid-id"})

        assert result.success is False
        assert result.attempts == 0
        mock_insert.assert_not_called()

    def test_invalid_date_rejected_without_touching_repository(self, monkeypatch):
        mock_insert = MagicMock(side_effect=AssertionError("repository should not be called"))
        monkeypatch.setattr("app.tools.campaigns_tools.CampaignRepository.insert", mock_insert)

        result = insert_campaign({**_SAMPLE_CAMPAIGN, "start_date": "04/11/2025"})

        assert result.success is False
        assert result.attempts == 0
        mock_insert.assert_not_called()

    def test_retries_once_after_a_transient_failure_then_succeeds(self, monkeypatch):
        monkeypatch.setattr(
            "app.tools.campaigns_tools.CampaignRepository.exists", MagicMock(return_value=False)
        )
        mock_insert = MagicMock(side_effect=[Exception("database is locked"), {**_SAMPLE_CAMPAIGN}])
        monkeypatch.setattr("app.tools.campaigns_tools.CampaignRepository.insert", mock_insert)

        result = insert_campaign({**_SAMPLE_CAMPAIGN})

        assert result.success is True
        assert result.attempts == 2
        assert mock_insert.call_count == 2


class TestUpdateCampaign:
    def test_update_success(self, db_conn):
        _insert_sample(db_conn)
        result = update_campaign({"campaign_id": "CMP-9001", "budget_allocated": 30000.0})
        assert result.success is True
        assert result.data["budget_allocated"] == 30000.0
        assert result.attempts == 1

    def test_update_missing_id_fails_naming_the_tool(self, db_conn):
        result = update_campaign({"campaign_id": "CMP-0000", "budget_allocated": 1.0})
        assert result.success is False
        assert "update_campaign" in result.error
        assert "CMP-0000" in result.error
        assert result.attempts == 2

    def test_update_requires_at_least_one_field_besides_id(self, monkeypatch):
        mock_update = MagicMock(side_effect=AssertionError("repository should not be called"))
        monkeypatch.setattr("app.tools.campaigns_tools.CampaignRepository.update", mock_update)

        result = update_campaign({"campaign_id": "CMP-9001"})

        assert result.success is False
        assert result.attempts == 0
        mock_update.assert_not_called()

    def test_retries_once_after_a_transient_failure_then_succeeds(self, monkeypatch):
        monkeypatch.setattr(
            "app.tools.campaigns_tools.CampaignRepository.exists", MagicMock(return_value=True)
        )
        mock_update = MagicMock(
            side_effect=[Exception("database is locked"), {**_SAMPLE_CAMPAIGN, "budget_allocated": 30000.0}]
        )
        monkeypatch.setattr("app.tools.campaigns_tools.CampaignRepository.update", mock_update)

        result = update_campaign({"campaign_id": "CMP-9001", "budget_allocated": 30000.0})

        assert result.success is True
        assert result.attempts == 2
        assert mock_update.call_count == 2


class TestDeleteCampaign:
    def test_delete_success(self, db_conn):
        _insert_sample(db_conn)
        result = delete_campaign({"campaign_id": "CMP-9001"})
        assert result.success is True
        assert result.data == {"campaign_id": "CMP-9001", "deleted": True}
        assert result.attempts == 1

    def test_delete_missing_id_fails_naming_the_tool(self, db_conn):
        result = delete_campaign({"campaign_id": "CMP-0000"})
        assert result.success is False
        assert "delete_campaign" in result.error
        assert "CMP-0000" in result.error
        assert result.attempts == 2

    def test_delete_never_accepts_a_filter(self, monkeypatch):
        # CampaignDelete only has `campaign_id` — passing a filter-shaped
        # payload instead is a validation failure, not a broad delete.
        mock_delete = MagicMock(side_effect=AssertionError("repository should not be called"))
        monkeypatch.setattr("app.tools.campaigns_tools.CampaignRepository.delete", mock_delete)

        result = delete_campaign({"channel": "Facebook"})

        assert result.success is False
        assert result.attempts == 0
        mock_delete.assert_not_called()

    def test_retries_once_after_a_transient_failure_then_succeeds(self, monkeypatch):
        monkeypatch.setattr(
            "app.tools.campaigns_tools.CampaignRepository.exists", MagicMock(return_value=True)
        )
        mock_delete = MagicMock(side_effect=[Exception("database is locked"), None])
        monkeypatch.setattr("app.tools.campaigns_tools.CampaignRepository.delete", mock_delete)

        result = delete_campaign({"campaign_id": "CMP-9001"})

        assert result.success is True
        assert result.attempts == 2
        assert mock_delete.call_count == 2
