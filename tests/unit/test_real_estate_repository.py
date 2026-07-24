"""Unit tests for ``RealEstateRepository``."""

from app.repositories.real_estate_repository import RealEstateRepository

# -----------------------------------------------------------------------
# Helpers — seed a small fixture dataset
# -----------------------------------------------------------------------

_SAMPLE_LISTING = {
    "listing_id": "LST-9001",
    "property_type": "House",
    "city": "Austin",
    "state": "Texas",
    "bedrooms": 4,
    "bathrooms": 2.5,
    "square_footage": 2200,
    "year_built": 2005,
    "list_price": 450000.0,
    "sale_price": None,
    "listing_status": "Active",
}


def _insert_sample(db_conn, overrides: dict | None = None):
    """Insert the sample listing (with optional overrides) directly via SQL."""
    data = {**_SAMPLE_LISTING, **(overrides or {})}
    cols = ", ".join(data.keys())
    placeholders = ", ".join("?" for _ in data)
    db_conn.execute(
        f"INSERT INTO real_estate_listings ({cols}) VALUES ({placeholders})",
        list(data.values()),
    )
    db_conn.commit()


# -----------------------------------------------------------------------
# Tests
# -----------------------------------------------------------------------


class TestQuery:
    def test_empty_table(self, db_conn):
        result = RealEstateRepository.query({}, limit=20)
        assert result == []

    def test_no_filters_returns_all_rows(self, db_conn):
        _insert_sample(db_conn)
        _insert_sample(db_conn, {"listing_id": "LST-9002", "city": "Dallas"})
        result = RealEstateRepository.query({}, limit=20)
        assert len(result) == 2

    def test_filters_by_city_and_state(self, db_conn):
        _insert_sample(db_conn)
        _insert_sample(db_conn, {"listing_id": "LST-9002", "city": "Dallas", "state": "Texas"})
        result = RealEstateRepository.query({"city": "Austin"}, limit=20)
        assert len(result) == 1
        assert result[0]["listing_id"] == "LST-9001"

    def test_filters_by_price_range(self, db_conn):
        _insert_sample(db_conn)
        _insert_sample(db_conn, {"listing_id": "LST-9002", "list_price": 900000.0})
        result = RealEstateRepository.query({"min_price": 500000}, limit=20)
        assert [r["listing_id"] for r in result] == ["LST-9002"]

    def test_limit_is_applied(self, db_conn):
        for i in range(5):
            _insert_sample(db_conn, {"listing_id": f"LST-900{i}"})
        result = RealEstateRepository.query({}, limit=2)
        assert len(result) == 2


class TestExists:
    def test_true_when_present(self, db_conn):
        _insert_sample(db_conn)
        assert RealEstateRepository.exists("LST-9001") is True

    def test_false_when_absent(self, db_conn):
        assert RealEstateRepository.exists("LST-0000") is False


class TestInsert:
    def test_insert_returns_inserted_row(self, db_conn):
        row = RealEstateRepository.insert({**_SAMPLE_LISTING})
        assert row["listing_id"] == "LST-9001"
        assert row["city"] == "Austin"
        assert RealEstateRepository.exists("LST-9001") is True

    def test_insert_duplicate_id_raises(self, db_conn):
        _insert_sample(db_conn)
        try:
            RealEstateRepository.insert({**_SAMPLE_LISTING})
            assert False, "expected a uniqueness violation"
        except Exception:
            pass


class TestUpdate:
    def test_update_fields_and_returns_updated_row(self, db_conn):
        _insert_sample(db_conn)
        row = RealEstateRepository.update(
            "LST-9001", {"listing_status": "Sold", "sale_price": 460000.0}
        )
        assert row["listing_status"] == "Sold"
        assert row["sale_price"] == 460000.0

    def test_update_nonexistent_id_returns_none(self, db_conn):
        result = RealEstateRepository.update("LST-0000", {"listing_status": "Sold"})
        assert result is None


class TestDelete:
    def test_delete_existing(self, db_conn):
        _insert_sample(db_conn)
        RealEstateRepository.delete("LST-9001")
        assert RealEstateRepository.exists("LST-9001") is False

    def test_delete_nonexistent_is_a_noop(self, db_conn):
        RealEstateRepository.delete("LST-0000")  # should not raise
