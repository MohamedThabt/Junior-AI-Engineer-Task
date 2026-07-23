"""Unit tests for ``MarketingRepository``."""

import pytest

from app.repositories.marketing_repository import MarketingRepository


# -----------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------

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


# -----------------------------------------------------------------------
# Tests
# -----------------------------------------------------------------------


class TestGetAllCampaigns:
    def test_empty_table(self, db_conn):
        result = MarketingRepository.get_all_campaigns()
        assert result == []

    def test_returns_all_rows(self, db_conn):
        _insert_sample(db_conn)
        _insert_sample(db_conn, {"campaign_id": "CMP-9002", "campaign_name": "Another"})
        result = MarketingRepository.get_all_campaigns()
        assert len(result) == 2


class TestGetCampaign:
    def test_found(self, db_conn):
        _insert_sample(db_conn)
        result = MarketingRepository.get_campaign("CMP-9001")
        assert result is not None
        assert result["channel"] == "Facebook"

    def test_not_found(self, db_conn):
        result = MarketingRepository.get_campaign("CMP-0000")
        assert result is None


class TestInsertCampaign:
    def test_insert_with_explicit_id(self, db_conn):
        cid = MarketingRepository.insert_campaign({**_SAMPLE_CAMPAIGN})
        assert cid == "CMP-9001"
        assert MarketingRepository.get_campaign("CMP-9001") is not None

    def test_insert_auto_id(self, db_conn):
        _insert_sample(db_conn)
        data = {k: v for k, v in _SAMPLE_CAMPAIGN.items() if k != "campaign_id"}
        cid = MarketingRepository.insert_campaign(data)
        assert cid == "CMP-9002"

    def test_insert_auto_id_empty_table(self, db_conn):
        data = {k: v for k, v in _SAMPLE_CAMPAIGN.items() if k != "campaign_id"}
        cid = MarketingRepository.insert_campaign(data)
        assert cid == "CMP-8001"


class TestUpdateCampaign:
    def test_update_fields(self, db_conn):
        _insert_sample(db_conn)
        MarketingRepository.update_campaign("CMP-9001", {"budget_allocated": 30000.0})
        row = MarketingRepository.get_campaign("CMP-9001")
        assert row["budget_allocated"] == 30000.0

    def test_update_empty_dict(self, db_conn):
        result = MarketingRepository.update_campaign("CMP-9001", {})
        assert result == 0


class TestDeleteCampaign:
    def test_delete_existing(self, db_conn):
        _insert_sample(db_conn)
        count = MarketingRepository.delete_campaign("CMP-9001")
        assert count == 1
        assert MarketingRepository.get_campaign("CMP-9001") is None

    def test_delete_nonexistent(self, db_conn):
        count = MarketingRepository.delete_campaign("CMP-0000")
        assert count == 0
