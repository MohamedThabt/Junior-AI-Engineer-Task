"""Data-access layer for the ``real_estate_listings`` SQLite table."""

from db.database import get_connection


class RealEstateRepository:
    """CRUD operations against ``real_estate_listings``."""

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    @staticmethod
    def get_all_listings() -> list[dict]:
        """Return every listing as a list of dicts."""
        conn = get_connection()
        try:
            rows = conn.execute("SELECT * FROM real_estate_listings").fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()

    @staticmethod
    def get_listing(listing_id: str) -> dict | None:
        """Return a single listing by its primary key, or *None*."""
        conn = get_connection()
        try:
            row = conn.execute(
                "SELECT * FROM real_estate_listings WHERE listing_id = ?",
                (listing_id,),
            ).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    @staticmethod
    def insert_listing(data: dict) -> str:
        """Insert a new listing and return the ``listing_id``.

        If ``listing_id`` is not present in *data*, the next sequential ID
        (``LST-XXXX``) is generated automatically.
        """
        conn = get_connection()
        try:
            if "listing_id" not in data or data["listing_id"] is None:
                row = conn.execute(
                    "SELECT listing_id FROM real_estate_listings ORDER BY listing_id DESC LIMIT 1"
                ).fetchone()
                if row:
                    last_num = int(row["listing_id"].split("-")[1])
                    data["listing_id"] = f"LST-{last_num + 1}"
                else:
                    data["listing_id"] = "LST-5001"

            cols = ", ".join(data.keys())
            placeholders = ", ".join("?" for _ in data)
            conn.execute(
                f"INSERT INTO real_estate_listings ({cols}) VALUES ({placeholders})",
                list(data.values()),
            )
            conn.commit()
            return data["listing_id"]
        finally:
            conn.close()

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    @staticmethod
    def update_listing(listing_id: str, updates: dict) -> int:
        """Update fields on a listing. Returns the number of rows changed."""
        if not updates:
            return 0
        conn = get_connection()
        try:
            set_clause = ", ".join(f"{col} = ?" for col in updates)
            values = list(updates.values()) + [listing_id]
            conn.execute(
                f"UPDATE real_estate_listings SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE listing_id = ?",
                values,
            )
            conn.commit()
            return conn.total_changes
        finally:
            conn.close()

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    @staticmethod
    def delete_listing(listing_id: str) -> int:
        """Delete a listing by ID. Returns the number of rows deleted."""
        conn = get_connection()
        try:
            cursor = conn.execute(
                "DELETE FROM real_estate_listings WHERE listing_id = ?",
                (listing_id,),
            )
            conn.commit()
            return cursor.rowcount
        finally:
            conn.close()
