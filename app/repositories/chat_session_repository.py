"""Data-access layer for the ``chat_sessions`` SQLite table.

Stores per-session conversational memory as a JSON blob so the ReAct agent
loop can persist and restore its message/turn history between turns.
"""

import json
import uuid

from db.database import get_connection


class ChatSessionRepository:
    """CRUD + context operations on ``chat_sessions``."""

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    @staticmethod
    def create_session(session_name: str) -> str:
        """Create a new session and return its UUID4 ``session_id``."""
        session_id = str(uuid.uuid4())
        conn = get_connection()
        try:
            conn.execute(
                "INSERT INTO chat_sessions (id, session_name) VALUES (?, ?)",
                (session_id, session_name),
            )
            conn.commit()
            return session_id
        finally:
            conn.close()

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    @staticmethod
    def get_session(session_id: str) -> dict | None:
        """Return the full session row as a dict, or *None* if not found."""
        conn = get_connection()
        try:
            row = conn.execute(
                "SELECT * FROM chat_sessions WHERE id = ?", (session_id,)
            ).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    @staticmethod
    def get_context(session_id: str) -> list:
        """Return the deserialized context (message history) for a session.

        Returns an empty list if the session does not exist or context is
        empty/null.
        """
        conn = get_connection()
        try:
            row = conn.execute(
                "SELECT context FROM chat_sessions WHERE id = ?", (session_id,)
            ).fetchone()
            if row is None or row["context"] is None:
                return []
            return json.loads(row["context"])
        finally:
            conn.close()

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    @staticmethod
    def save_context(session_id: str, context: list) -> None:
        """Serialize *context* to JSON and persist it, updating ``updated_at``."""
        conn = get_connection()
        try:
            conn.execute(
                "UPDATE chat_sessions SET context = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (json.dumps(context), session_id),
            )
            conn.commit()
        finally:
            conn.close()
