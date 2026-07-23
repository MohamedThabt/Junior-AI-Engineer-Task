"""Unit tests for ``RealEstateRepository``."""

import pytest

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


class TestGetAllListings:
    def test_empty_table(self, db_conn):
        result = RealEstateRepository.get_all_listings()
        assert result == []

    def test_returns_all_rows(self, db_conn):
        _insert_sample(db_conn)
        _insert_sample(db_conn, {"listing_id": "LST-9002", "city": "Dallas"})
        result = RealEstateRepository.get_all_listings()
        assert len(result) == 2


class TestGetListing:
    def test_found(self, db_conn):
        _insert_sample(db_conn)
        result = RealEstateRepository.get_listing("LST-9001")
        assert result is not None
        assert result["city"] == "Austin"

    def test_not_found(self, db_conn):
        result = RealEstateRepository.get_listing("LST-0000")
        assert result is None


class TestInsertListing:
    def test_insert_with_explicit_id(self, db_conn):
        lid = RealEstateRepository.insert_listing({**_SAMPLE_LISTING})
        assert lid == "LST-9001"
        assert RealEstateRepository.get_listing("LST-9001") is not None

    def test_insert_auto_id(self, db_conn):
        _insert_sample(db_conn)  # LST-9001 already exists
        data = {k: v for k, v in _SAMPLE_LISTING.items() if k != "listing_id"}
        lid = RealEstateRepository.insert_listing(data)
        assert lid == "LST-9002"

    def test_insert_auto_id_empty_table(self, db_conn):
        data = {k: v for k, v in _SAMPLE_LISTING.items() if k != "listing_id"}
        lid = RealEstateRepository.insert_listing(data)
        assert lid == "LST-5001"


class TestUpdateListing:
    def test_update_fields(self, db_conn):
        _insert_sample(db_conn)
        RealEstateRepository.update_listing("LST-9001", {"listing_status": "Sold", "sale_price": 460000.0})
        row = RealEstateRepository.get_listing("LST-9001")
        assert row["listing_status"] == "Sold"
        assert row["sale_price"] == 460000.0

    def test_update_empty_dict(self, db_conn):
        result = RealEstateRepository.update_listing("LST-9001", {})
        assert result == 0


class TestDeleteListing:
    def test_delete_existing(self, db_conn):
        _insert_sample(db_conn)
        count = RealEstateRepository.delete_listing("LST-9001")
        assert count == 1
        assert RealEstateRepository.get_listing("LST-9001") is None

    def test_delete_nonexistent(self, db_conn):
        count = RealEstateRepository.delete_listing("LST-0000")
        assert count == 0
