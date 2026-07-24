"""Shared pytest fixtures for all tests.

Provides an in-memory SQLite database with migrations applied and a
monkeypatch that redirects ``db.database.get_connection`` so every
repository call uses the test database instead of ``db/app.db``.
"""

import sqlite3

import pytest

from db.database import init_db


class _NonClosableConnection:
    """Thin proxy around a real ``sqlite3.Connection`` that turns ``.close()``
    into a no-op.

    Repository methods follow the pattern ``conn = get_connection(); …;
    conn.close()``.  For production this is correct (each call opens and
    closes its own file-backed connection).  In tests, however, every call
    shares a **single** in-memory connection — closing it destroys the data.
    This wrapper prevents that while forwarding everything else.
    """

    def __init__(self, real_conn: sqlite3.Connection):
        self._conn = real_conn

    def close(self):          # noqa: D401 — intentional no-op
        """Intentional no-op so the shared test connection stays alive."""

    def __getattr__(self, name):
        return getattr(self._conn, name)


@pytest.fixture()
def db_conn():
    """Yield an in-memory SQLite connection with all migrations applied.

    The connection is shared across the test so that inserts done in the
    test body are visible to repository helpers that call
    ``get_connection()``.
    """
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    init_db(conn)
    yield conn
    conn.close()


@pytest.fixture(autouse=True)
def _patch_get_connection(db_conn, monkeypatch):
    """Redirect every ``get_connection()`` call to the in-memory test db.

    Returns a non-closable wrapper so repository ``.close()`` calls are
    harmless.
    """
    wrapper = _NonClosableConnection(db_conn)

    monkeypatch.setattr("db.database.get_connection", lambda *_a, **_kw: wrapper)

    # Also patch each repository module that imported the function at module level.
    for mod_path in (
        "app.repositories.real_estate_repository.get_connection",
        "app.repositories.campaign_repository.get_connection",
        "app.repositories.chat_session_repository.get_connection",
    ):
        try:
            monkeypatch.setattr(mod_path, lambda *_a, **_kw: wrapper)
        except AttributeError:
            pass  # module not imported yet — that's fine

