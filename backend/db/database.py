"""SQLite connection factory and migration runner.

Provides two public functions:
- ``get_connection()`` — returns a ready-to-use ``sqlite3.Connection``.
- ``init_db()`` — applies all pending SQL migrations from ``db/migrations/``.
"""

import os
import sqlite3
from pathlib import Path

# Resolve paths relative to *this* file so they work regardless of cwd.
_DB_DIR = Path(__file__).resolve().parent
DB_PATH = _DB_DIR / "app.db"
_MIGRATIONS_DIR = _DB_DIR / "migrations"


def get_connection(
    db_path: str | Path | None = None, timeout: float | None = None
) -> sqlite3.Connection:
    """Open (or create) the SQLite database and return a connection.

    Parameters
    ----------
    db_path:
        Override the default path (useful for tests that pass ``:memory:``
        or a temp file).  When *None*, ``db/app.db`` is used.
    timeout:
        SQLite's own busy-timeout (seconds): how long a call will wait on
        lock contention before raising ``sqlite3.OperationalError``, rather
        than blocking indefinitely. Callers that need a bounded per-call
        timeout (e.g. the tool layer) pass this explicitly; ``None`` falls
        back to sqlite3's own default (5s).
    """
    path = str(db_path) if db_path is not None else str(DB_PATH)
    kwargs = {} if timeout is None else {"timeout": timeout}
    conn = sqlite3.connect(path, **kwargs)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _ensure_migrations_table(conn: sqlite3.Connection) -> None:
    """Create the internal ``_migrations`` bookkeeping table if it doesn't exist."""
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS _migrations (
            filename   TEXT PRIMARY KEY,
            applied_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()


def init_db(conn: sqlite3.Connection | None = None) -> None:
    """Apply all pending migrations in filename-sorted order.

    Parameters
    ----------
    conn:
        Optional pre-existing connection (e.g. in-memory for tests).
        When *None*, a new connection to ``db/app.db`` is opened.
    """
    own_conn = conn is None
    if own_conn:
        conn = get_connection()

    try:
        _ensure_migrations_table(conn)

        # Collect already-applied filenames.
        applied = {
            row["filename"]
            for row in conn.execute("SELECT filename FROM _migrations").fetchall()
        }

        # Scan migration files in sorted order.
        if not _MIGRATIONS_DIR.is_dir():
            return

        migration_files = sorted(
            f for f in os.listdir(_MIGRATIONS_DIR) if f.endswith(".sql")
        )

        for filename in migration_files:
            if filename in applied:
                continue

            sql = (_MIGRATIONS_DIR / filename).read_text(encoding="utf-8")
            conn.executescript(sql)
            conn.execute(
                "INSERT INTO _migrations (filename) VALUES (?)", (filename,)
            )
            conn.commit()
    finally:
        if own_conn:
            conn.close()
