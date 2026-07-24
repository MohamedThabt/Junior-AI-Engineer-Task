"""Unit tests for SessionController FastAPI routes."""

from fastapi.testclient import TestClient
import pytest

from app.repositories.chat_session_repository import ChatSessionRepository
from main import app

client = TestClient(app)


class TestSessionController:
    """Test suite for /api/sessions CRUD endpoints."""

    def test_create_session(self, db_conn):
        """Test POST /api/sessions/ creates session and returns 201."""
        response = client.post("/api/sessions/", json={"session_name": "Test Session"})
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert "session_id" in data
        assert data["session_name"] == "Test Session"

    def test_list_sessions_excludes_context(self, db_conn):
        """Test GET /api/sessions/ returns lightweight session list without context field."""
        sid1 = ChatSessionRepository.create_session("Session 1")
        sid2 = ChatSessionRepository.create_session("Session 2")
        ChatSessionRepository.save_context(sid1, [{"role": "user", "content": "Hello"}])

        response = client.get("/api/sessions/")
        assert response.status_code == 200
        sessions = response.json()
        assert len(sessions) >= 2

        for session in sessions:
            assert "id" in session
            assert "session_id" in session
            assert "session_name" in session
            assert "created_at" in session
            assert "updated_at" in session
            assert "context" not in session  # Must NOT include context blob

    def test_show_session_success(self, db_conn):
        """Test GET /api/sessions/{id} returns full session with deserialized context list."""
        sid = ChatSessionRepository.create_session("Detailed Session")
        history = [
            {"role": "user", "content": "Show listings in Cairo"},
            {"role": "assistant", "content": "Found 2 listings."},
        ]
        ChatSessionRepository.save_context(sid, history)

        response = client.get(f"/api/sessions/{sid}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sid
        assert data["session_id"] == sid
        assert data["session_name"] == "Detailed Session"
        assert isinstance(data["context"], list)
        assert data["context"] == history

    def test_show_session_not_found(self, db_conn):
        """Test GET /api/sessions/{id} returns 404 for nonexistent session."""
        response = client.get("/api/sessions/nonexistent-uuid-1234")
        assert response.status_code == 404
        assert response.json()["detail"] == "Session not found"

    def test_delete_session_success_and_subsequent_404(self, db_conn):
        """Test DELETE /api/sessions/{id} removes session and subsequent show returns 404."""
        sid = ChatSessionRepository.create_session("To Be Deleted")
        
        # Verify exists
        show_resp = client.get(f"/api/sessions/{sid}")
        assert show_resp.status_code == 200

        # Delete
        del_resp = client.delete(f"/api/sessions/{sid}")
        assert del_resp.status_code == 204

        # Subsequent show must return 404
        subsequent_show = client.get(f"/api/sessions/{sid}")
        assert subsequent_show.status_code == 404

    def test_delete_session_not_found(self, db_conn):
        """Test DELETE /api/sessions/{id} returns 404 for nonexistent session."""
        response = client.delete("/api/sessions/nonexistent-uuid-9999")
        assert response.status_code == 404
