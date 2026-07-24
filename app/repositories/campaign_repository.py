"""Data-access layer for the ``marketing_campaigns`` SQLite table.

All SQL for this table lives here — the tool layer
(``app/tools/campaigns_tools.py``) only ever calls these methods, never raw
SQL. Every connection is opened with the configured busy-timeout
(``settings.tool_timeout_seconds``) so a locked/hung call surfaces as an
``sqlite3.OperationalError`` the tool's retry loop can handle, rather than
blocking indefinitely.
"""

from config.settings import settings
from db.database import get_connection

_TABLE = "marketing_campaigns"


class CampaignRepository:
    """Generic CRUD + query operations against ``marketing_campaigns``."""

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    @staticmethod
    def query(filters: dict, limit: int) -> list[dict]:
        """Return campaigns matching *filters*, capped at *limit* rows."""
        conditions: list[str] = []
        params: list = []

        if filters.get("channel"):
            conditions.append("channel = ?")
            params.append(filters["channel"])
        if filters.get("campaign_name"):
            conditions.append("campaign_name = ?")
            params.append(filters["campaign_name"])
        if filters.get("start_date_from"):
            conditions.append("start_date >= ?")
            params.append(filters["start_date_from"])
        if filters.get("end_date_to"):
            conditions.append("end_date <= ?")
            params.append(filters["end_date_to"])

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
    def exists(campaign_id: str) -> bool:
        """Return whether *campaign_id* already exists."""
        conn = get_connection(timeout=settings.tool_timeout_seconds)
        try:
            row = conn.execute(
                f"SELECT 1 FROM {_TABLE} WHERE campaign_id = ?", (campaign_id,)
            ).fetchone()
            return row is not None
        finally:
            conn.close()

    @staticmethod
    def _fetch_by_id(conn, campaign_id: str) -> dict | None:
        row = conn.execute(
            f"SELECT * FROM {_TABLE} WHERE campaign_id = ?", (campaign_id,)
        ).fetchone()
        return dict(row) if row else None

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    @staticmethod
    def insert(data: dict) -> dict:
        """Insert a new campaign and return the inserted row.

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
            return CampaignRepository._fetch_by_id(conn, data["campaign_id"])
        finally:
            conn.close()

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    @staticmethod
    def update(campaign_id: str, fields: dict) -> dict:
        """Update *fields* on the campaign identified by *campaign_id* and
        return the updated row."""
        conn = get_connection(timeout=settings.tool_timeout_seconds)
        try:
            set_clause = ", ".join(f"{col} = ?" for col in fields)
            values = list(fields.values()) + [campaign_id]
            try:
                conn.execute(
                    f"UPDATE {_TABLE} SET {set_clause}, updated_at = CURRENT_TIMESTAMP "
                    "WHERE campaign_id = ?",
                    values,
                )
                conn.commit()
            except Exception:
                conn.rollback()
                raise
            return CampaignRepository._fetch_by_id(conn, campaign_id)
        finally:
            conn.close()

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    @staticmethod
    def delete(campaign_id: str) -> None:
        """Delete the campaign identified by *campaign_id*."""
        conn = get_connection(timeout=settings.tool_timeout_seconds)
        try:
            try:
                conn.execute(f"DELETE FROM {_TABLE} WHERE campaign_id = ?", (campaign_id,))
                conn.commit()
            except Exception:
                conn.rollback()
                raise
        finally:
            conn.close()
