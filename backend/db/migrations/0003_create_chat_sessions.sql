-- Migration: 0003_create_chat_sessions
-- Creates the chat_sessions table for persisting ReAct agent conversation memory.

CREATE TABLE IF NOT EXISTS chat_sessions (
    id           TEXT PRIMARY KEY,
    session_name TEXT NOT NULL,
    context      TEXT DEFAULT '[]',
    created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at   TEXT DEFAULT CURRENT_TIMESTAMP
);
