"""Unit tests for ``ChatSessionRepository``."""

import json

import pytest

from app.repositories.chat_session_repository import ChatSessionRepository


class TestCreateSession:
    def test_returns_uuid(self, db_conn):
        sid = ChatSessionRepository.create_session("My Session")
        assert isinstance(sid, str)
        assert len(sid) == 36  # UUID4 format: 8-4-4-4-12

    def test_session_stored(self, db_conn):
        sid = ChatSessionRepository.create_session("Stored Session")
        row = db_conn.execute(
            "SELECT * FROM chat_sessions WHERE id = ?", (sid,)
        ).fetchone()
        assert row is not None
        assert row["session_name"] == "Stored Session"
        assert row["context"] == "[]"


class TestGetSession:
    def test_found(self, db_conn):
        sid = ChatSessionRepository.create_session("Lookup Test")
        session = ChatSessionRepository.get_session(sid)
        assert session is not None
        assert session["session_name"] == "Lookup Test"
        assert session["id"] == sid

    def test_not_found(self, db_conn):
        session = ChatSessionRepository.get_session("nonexistent-id")
        assert session is None


class TestGetContext:
    def test_empty_default(self, db_conn):
        sid = ChatSessionRepository.create_session("Empty Context")
        ctx = ChatSessionRepository.get_context(sid)
        assert ctx == []

    def test_nonexistent_session(self, db_conn):
        ctx = ChatSessionRepository.get_context("nope")
        assert ctx == []


class TestSaveContext:
    def test_save_and_reload(self, db_conn):
        sid = ChatSessionRepository.create_session("Save Test")
        history = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"},
        ]
        ChatSessionRepository.save_context(sid, history)

        ctx = ChatSessionRepository.get_context(sid)
        assert ctx == history

    def test_updates_updated_at(self, db_conn):
        sid = ChatSessionRepository.create_session("Timestamp Test")
        before = ChatSessionRepository.get_session(sid)["updated_at"]

        # Save new context — updated_at should change (or at least stay
        # consistent; in a fast test it may be the same second).
        ChatSessionRepository.save_context(sid, [{"role": "user", "content": "ping"}])
        after = ChatSessionRepository.get_session(sid)["updated_at"]
        assert after >= before

    def test_increments_version_on_each_save(self, db_conn):
        sid = ChatSessionRepository.create_session("Version Test")
        assert ChatSessionRepository.get_session(sid)["version"] == 0

        ChatSessionRepository.save_context(sid, [{"role": "user", "content": "a"}])
        assert ChatSessionRepository.get_session(sid)["version"] == 1

        ChatSessionRepository.save_context(sid, [{"role": "user", "content": "a"}, {"role": "assistant", "content": "b"}])
        assert ChatSessionRepository.get_session(sid)["version"] == 2

    def test_redacts_sensitive_keys_before_persisting(self, db_conn):
        sid = ChatSessionRepository.create_session("Redaction Test")
        context = [
            {
                "role": "tool",
                "content": "envelope",
                "meta": {"args": {"city": "Austin", "api_key": "sk-secret-123"}},
            }
        ]

        ChatSessionRepository.save_context(sid, context)

        reloaded = ChatSessionRepository.get_context(sid)
        assert reloaded[0]["meta"]["args"]["api_key"] == "[REDACTED]"
        assert reloaded[0]["meta"]["args"]["city"] == "Austin"

    def test_lost_race_merges_new_entries_instead_of_clobbering(self, db_conn):
        sid = ChatSessionRepository.create_session("Concurrency Test")
        # This request loaded the session at version 0 with a single base entry.
        base_entry = {"role": "user", "content": "base"}
        # A concurrent writer then persisted a new turn on top (version -> 1)
        # before our save lands.
        db_conn.execute(
            "UPDATE chat_sessions SET context = ?, version = 1 WHERE id = ?",
            (json.dumps([base_entry, {"role": "assistant", "content": "concurrent-answer"}]), sid),
        )
        db_conn.commit()

        # Our save carries the base entry we loaded plus our own new entry,
        # guarded by the version we loaded (0).
        our_context = [base_entry, {"role": "assistant", "content": "our-new-answer"}]
        ChatSessionRepository.save_context(sid, our_context, expected_version=0)

        reloaded = ChatSessionRepository.get_context(sid)
        contents = [e["content"] for e in reloaded]
        # The concurrent writer's turn is preserved AND ours is appended —
        # nothing silently dropped.
        assert contents == ["base", "concurrent-answer", "our-new-answer"]
        # Version advanced past the concurrent writer's.
        assert ChatSessionRepository.get_session(sid)["version"] == 2


class TestFullRoundTrip:
    """End-to-end: create → save → reload → verify."""

    def test_round_trip(self, db_conn):
        # 1. Create
        sid = ChatSessionRepository.create_session("Round Trip")

        # 2. Save multi-turn context
        turns = [
            {"role": "user", "content": "Show all houses in Texas"},
            {"role": "assistant", "content": "Found 42 listings in Texas."},
            {"role": "user", "content": "Filter those under $400k"},
            {"role": "assistant", "content": "12 listings under $400,000."},
        ]
        ChatSessionRepository.save_context(sid, turns)

        # 3. Reload and verify
        reloaded = ChatSessionRepository.get_context(sid)
        assert reloaded == turns

        # 4. Verify session metadata intact
        session = ChatSessionRepository.get_session(sid)
        assert session["session_name"] == "Round Trip"
        assert json.loads(session["context"]) == turns
