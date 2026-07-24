"""Data-access layer for the ``real_estate_listings`` SQLite table.

All SQL for this table lives here — the tool layer
(``app/tools/real_estate_tools.py``) only ever calls these methods, never
raw SQL. Every connection is opened with the configured busy-timeout
(``settings.tool_timeout_seconds``) so a locked/hung call surfaces as an
``sqlite3.OperationalError`` the tool's retry loop can handle, rather than
blocking indefinitely.
"""

from config.settings import settings
from db.database import get_connection

_TABLE = "real_estate_listings"


class RealEstateRepository:
    """Generic CRUD + query operations against ``real_estate_listings``."""

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    @staticmethod
    def query(filters: dict, limit: int) -> list[dict]:
        """Return listings matching *filters*, capped at *limit* rows."""
        conditions: list[str] = []
        params: list = []

        if filters.get("city"):
            conditions.append("city = ?")
            params.append(filters["city"])
        if filters.get("state"):
            conditions.append("state = ?")
            params.append(filters["state"])
        if filters.get("listing_status"):
            conditions.append("listing_status = ?")
            params.append(filters["listing_status"])
        if filters.get("min_price") is not None:
            conditions.append("list_price >= ?")
            params.append(filters["min_price"])
        if filters.get("max_price") is not None:
            conditions.append("list_price <= ?")
            params.append(filters["max_price"])
        if filters.get("min_bedrooms") is not None:
            conditions.append("bedrooms >= ?")
            params.append(filters["min_bedrooms"])
        if filters.get("max_bedrooms") is not None:
            conditions.append("bedrooms <= ?")
            params.append(filters["max_bedrooms"])
        if filters.get("min_bathrooms") is not None:
            conditions.append("bathrooms >= ?")
            params.append(filters["min_bathrooms"])
        if filters.get("max_bathrooms") is not None:
            conditions.append("bathrooms <= ?")
            params.append(filters["max_bathrooms"])

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        conn = get_connection(timeout=settings.tool_timeout_seconds)
        try:
            rows = conn.execute(
                f"SELECT * FROM {_TABLE} {where_clause} LIMIT ?",
                (*params, limit),
            ).fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()

    @staticmethod
    def exists(listing_id: str) -> bool:
        """Return whether *listing_id* already exists."""
        conn = get_connection(timeout=settings.tool_timeout_seconds)
        try:
            row = conn.execute(
                f"SELECT 1 FROM {_TABLE} WHERE listing_id = ?", (listing_id,)
            ).fetchone()
            return row is not None
        finally:
            conn.close()

    @staticmethod
    def _fetch_by_id(conn, listing_id: str) -> dict | None:
        row = conn.execute(
            f"SELECT * FROM {_TABLE} WHERE listing_id = ?", (listing_id,)
        ).fetchone()
        return dict(row) if row else None

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    @staticmethod
    def insert(data: dict) -> dict:
        """Insert a new listing and return the inserted row.

        Callers (the tool layer) are responsible for checking the primary
        key doesn't already exist first — this method always attempts the
        insert and lets a ``UNIQUE`` constraint violation raise.
        """
        conn = get_connection(timeout=settings.tool_timeout_seconds)
        try:
            cols = ", ".join(data.keys())
            placeholders = ", ".join("?" for _ in data)
            try:
                conn.execute(
                    f"INSERT INTO {_TABLE} ({cols}) VALUES ({placeholders})",
                    list(data.values()),
                )
                conn.commit()
            except Exception:
                conn.rollback()
                raise
            return RealEstateRepository._fetch_by_id(conn, data["listing_id"])
        finally:
            conn.close()

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    @staticmethod
    def update(listing_id: str, fields: dict) -> dict | None:
        """Update *fields* on the listing identified by *listing_id* and
        return the updated row."""
        conn = get_connection(timeout=settings.tool_timeout_seconds)
        try:
            if not fields:
                return RealEstateRepository._fetch_by_id(conn, listing_id)
            set_clause = ", ".join(f"{col} = ?" for col in fields)
            values = list(fields.values()) + [listing_id]
            try:
                conn.execute(
                    f"UPDATE {_TABLE} SET {set_clause}, updated_at = CURRENT_TIMESTAMP "
                    "WHERE listing_id = ?",
                    values,
                )
                conn.commit()
            except Exception:
                conn.rollback()
                raise
            return RealEstateRepository._fetch_by_id(conn, listing_id)
        finally:
            conn.close()

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    @staticmethod
    def delete(listing_id: str) -> None:
        """Delete the listing identified by *listing_id*."""
        conn = get_connection(timeout=settings.tool_timeout_seconds)
        try:
            try:
                conn.execute(f"DELETE FROM {_TABLE} WHERE listing_id = ?", (listing_id,))
                conn.commit()
            except Exception:
                conn.rollback()
                raise
        finally:
            conn.close()
