-- Migration: 0004_add_chat_sessions_version
-- Adds an optimistic-concurrency version counter to chat_sessions. save_context
-- bumps this on every write and guards its UPDATE with the version it loaded,
-- so two overlapping requests on the same session can no longer silently clobber
-- each other's appended turns (last-writer-wins loses data otherwise).

ALTER TABLE chat_sessions ADD COLUMN version INTEGER NOT NULL DEFAULT 0;
