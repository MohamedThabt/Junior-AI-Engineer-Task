"""Data-access layer for the ``chat_sessions`` SQLite table.

Stores per-session conversational memory as a JSON blob so the ReAct agent
loop can persist and restore its message/turn history between turns. Writes
use an optimistic-concurrency ``version`` guard so two overlapping requests on
the same session can't silently clobber each other's appended turns.
"""

import json
import uuid

from app.utilities.redaction import redact_deep
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
    def get_or_create(
        session_id: str | None, default_session_name: str
    ) -> tuple[str, list, bool, int]:
        """Resolve *session_id* to an existing session, or create a new one.

        Returns ``(resolved_session_id, context, is_new, version)``. The
        ``version`` is the value at load time; pass it back to
        ``save_context`` as ``expected_version`` so a concurrent writer can be
        detected. A missing or stale/unknown ``session_id`` is treated the same
        way (a fresh session is created) so a client can always continue the
        conversation with whatever id comes back, even after a bad id.
        """
        if session_id:
            existing = ChatSessionRepository.get_session(session_id)
            if existing is not None:
                raw_context = existing.get("context")
                context = json.loads(raw_context) if isinstance(raw_context, str) else (raw_context or [])
                return session_id, context, False, existing.get("version", 0)

        new_id = ChatSessionRepository.create_session(default_session_name)
        return new_id, [], True, 0

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    @staticmethod
    def _merge_on_common_prefix(stored: list, ours: list) -> list:
        """Append the entries unique to *ours* onto *stored*, aligning on their
        longest common prefix. Both share the context we loaded; each side then
        appended its own turns. Keeping *stored*'s tail and adding ours means a
        concurrent writer's turns are never dropped."""
        i = 0
        while i < len(stored) and i < len(ours) and stored[i] == ours[i]:
            i += 1
        return stored + ours[i:]

    @staticmethod
    def save_context(session_id: str, context: list, expected_version: int | None = None) -> None:
        """Serialize *context* to JSON and persist it, updating ``updated_at``.

        Secrets are redacted (any key whose name looks like a credential) before
        the blob is written, so a sensitive value that appeared in a tool's args
        or result never lands in the database.

        When *expected_version* is given, the write is guarded with
        ``WHERE id=? AND version=?`` (optimistic concurrency). If a concurrent
        writer already advanced the version (0 rows updated), the stored context
        is reloaded and this call's new entries are merged on top (aligning on
        the common prefix), then the write is retried once — so a slow request
        can't clobber a newer turn. When *expected_version* is ``None`` the write
        is unconditional (legacy/simple callers).
        """
        redacted = redact_deep(context)

        conn = get_connection()
        try:
            if expected_version is None:
                conn.execute(
                    "UPDATE chat_sessions SET context = ?, version = version + 1, "
                    "updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    (json.dumps(redacted), session_id),
                )
                conn.commit()
                return

            guard_version = expected_version
            for _attempt in range(2):
                cursor = conn.execute(
                    "UPDATE chat_sessions "
                    "SET context = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP "
                    "WHERE id = ? AND version = ?",
                    (json.dumps(redacted), session_id, guard_version),
                )
                conn.commit()
                if cursor.rowcount > 0:
                    return

                # Either the session is gone, or we lost the race. Reload;
                # if gone, nothing to persist.
                row = conn.execute(
                    "SELECT context, version FROM chat_sessions WHERE id = ?", (session_id,)
                ).fetchone()
                if row is None:
                    return
                current = json.loads(row["context"]) if row["context"] else []
                redacted = ChatSessionRepository._merge_on_common_prefix(current, redacted)
                guard_version = row["version"]
            # Second attempt also raced — leave the concurrent writer's state as
            # the authority rather than looping indefinitely.
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

