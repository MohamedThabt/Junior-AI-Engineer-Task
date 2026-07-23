"""Data-access layer for the ``marketing_campaigns`` SQLite table."""

from db.database import get_connection


class MarketingRepository:
    """CRUD operations against ``marketing_campaigns``."""

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    @staticmethod
    def get_all_campaigns() -> list[dict]:
        """Return every campaign as a list of dicts."""
        conn = get_connection()
        try:
            rows = conn.execute("SELECT * FROM marketing_campaigns").fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()

    @staticmethod
    def get_campaign(campaign_id: str) -> dict | None:
        """Return a single campaign by its primary key, or *None*."""
        conn = get_connection()
        try:
            row = conn.execute(
                "SELECT * FROM marketing_campaigns WHERE campaign_id = ?",
                (campaign_id,),
            ).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    @staticmethod
    def insert_campaign(data: dict) -> str:
        """Insert a new campaign and return the ``campaign_id``.

        If ``campaign_id`` is not present in *data*, the next sequential ID
        (``CMP-XXXX``) is generated automatically.
        """
        conn = get_connection()
        try:
            if "campaign_id" not in data or data["campaign_id"] is None:
                row = conn.execute(
                    "SELECT campaign_id FROM marketing_campaigns ORDER BY campaign_id DESC LIMIT 1"
                ).fetchone()
                if row:
                    last_num = int(row["campaign_id"].split("-")[1])
                    data["campaign_id"] = f"CMP-{last_num + 1}"
                else:
                    data["campaign_id"] = "CMP-8001"

            cols = ", ".join(data.keys())
            placeholders = ", ".join("?" for _ in data)
            conn.execute(
                f"INSERT INTO marketing_campaigns ({cols}) VALUES ({placeholders})",
                list(data.values()),
            )
            conn.commit()
            return data["campaign_id"]
        finally:
            conn.close()

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    @staticmethod
    def update_campaign(campaign_id: str, updates: dict) -> int:
        """Update fields on a campaign. Returns the number of rows changed."""
        if not updates:
            return 0
        conn = get_connection()
        try:
            set_clause = ", ".join(f"{col} = ?" for col in updates)
            values = list(updates.values()) + [campaign_id]
            conn.execute(
                f"UPDATE marketing_campaigns SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE campaign_id = ?",
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
    def delete_campaign(campaign_id: str) -> int:
        """Delete a campaign by ID. Returns the number of rows deleted."""
        conn = get_connection()
        try:
            cursor = conn.execute(
                "DELETE FROM marketing_campaigns WHERE campaign_id = ?",
                (campaign_id,),
            )
            conn.commit()
            return cursor.rowcount
        finally:
            conn.close()
