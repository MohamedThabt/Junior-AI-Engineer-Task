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
    def list_sessions() -> list[dict]:
        """Return all sessions without context blob, sorted by created_at descending."""
        conn = get_connection()
        try:
            rows = conn.execute(
                "SELECT id, session_name, created_at, updated_at FROM chat_sessions ORDER BY created_at DESC"
            ).fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()

    @staticmethod
    def get_all_sessions() -> list[dict]:
        """Return all sessions sorted by created_at descending."""
        conn = get_connection()
        try:
            rows = conn.execute(
                "SELECT * FROM chat_sessions ORDER BY created_at DESC"
            ).fetchall()
            return [dict(row) for row in rows]
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

    @staticmethod
    def get_or_create(session_id: str | None, default_session_name: str) -> tuple[str, list, bool]:
        """Resolve *session_id* to an existing session, or create a new one.

        Returns ``(resolved_session_id, context, is_new)``. A missing or
        stale/unknown ``session_id`` is treated the same way (a fresh
        session is created) so a client can always continue the
        conversation with whatever id comes back, even after a bad id.
        """
        if session_id:
            existing = ChatSessionRepository.get_session(session_id)
            if existing is not None:
                raw_context = existing.get("context")
                context = json.loads(raw_context) if isinstance(raw_context, str) else (raw_context or [])
                return session_id, context, False

        new_id = ChatSessionRepository.create_session(default_session_name)
        return new_id, [], True

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

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    @staticmethod
    def delete_session(session_id: str) -> bool:
        """Delete a session by ID. Returns True if deleted, False if not found."""
        conn = get_connection()
        try:
            cursor = conn.execute(
                "DELETE FROM chat_sessions WHERE id = ?", (session_id,)
            )
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

