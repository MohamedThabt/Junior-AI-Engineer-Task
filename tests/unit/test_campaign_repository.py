"""Unit tests for ``CampaignRepository``."""

from app.repositories.campaign_repository import CampaignRepository

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


class TestQuery:
    def test_empty_table(self, db_conn):
        result = CampaignRepository.query({}, limit=20)
        assert result == []

    def test_no_filters_returns_all_rows(self, db_conn):
        _insert_sample(db_conn)
        _insert_sample(db_conn, {"campaign_id": "CMP-9002", "campaign_name": "Another"})
        result = CampaignRepository.query({}, limit=20)
        assert len(result) == 2

    def test_filters_by_channel(self, db_conn):
        _insert_sample(db_conn)
        _insert_sample(db_conn, {"campaign_id": "CMP-9002", "channel": "LinkedIn"})
        result = CampaignRepository.query({"channel": "LinkedIn"}, limit=20)
        assert [r["campaign_id"] for r in result] == ["CMP-9002"]

    def test_filters_by_date_range(self, db_conn):
        _insert_sample(db_conn)
        _insert_sample(
            db_conn,
            {"campaign_id": "CMP-9002", "start_date": "2025-01-01", "end_date": "2025-01-31"},
        )
        result = CampaignRepository.query({"start_date_from": "2025-04-01"}, limit=20)
        assert [r["campaign_id"] for r in result] == ["CMP-9001"]

    def test_limit_is_applied(self, db_conn):
        for i in range(5):
            _insert_sample(db_conn, {"campaign_id": f"CMP-900{i}"})
        result = CampaignRepository.query({}, limit=2)
        assert len(result) == 2


class TestExists:
    def test_true_when_present(self, db_conn):
        _insert_sample(db_conn)
        assert CampaignRepository.exists("CMP-9001") is True

    def test_false_when_absent(self, db_conn):
        assert CampaignRepository.exists("CMP-0000") is False


class TestInsert:
    def test_insert_returns_inserted_row(self, db_conn):
        row = CampaignRepository.insert({**_SAMPLE_CAMPAIGN})
        assert row["campaign_id"] == "CMP-9001"
        assert row["channel"] == "Facebook"
        assert CampaignRepository.exists("CMP-9001") is True

    def test_insert_duplicate_id_raises(self, db_conn):
        _insert_sample(db_conn)
        try:
            CampaignRepository.insert({**_SAMPLE_CAMPAIGN})
            assert False, "expected a uniqueness violation"
        except Exception:
            pass


class TestUpdate:
    def test_update_fields_and_returns_updated_row(self, db_conn):
        _insert_sample(db_conn)
        row = CampaignRepository.update("CMP-9001", {"budget_allocated": 30000.0})
        assert row["budget_allocated"] == 30000.0

    def test_update_nonexistent_id_returns_none(self, db_conn):
        result = CampaignRepository.update("CMP-0000", {"budget_allocated": 1.0})
        assert result is None


class TestDelete:
    def test_delete_existing(self, db_conn):
        _insert_sample(db_conn)
        CampaignRepository.delete("CMP-9001")
        assert CampaignRepository.exists("CMP-9001") is False

    def test_delete_nonexistent_is_a_noop(self, db_conn):
        CampaignRepository.delete("CMP-0000")  # should not raise
