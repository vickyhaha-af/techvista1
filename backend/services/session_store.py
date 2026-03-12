"""
Supabase PostgreSQL session store — persists sessions reliably across restarts.
TTL: 24 hours (auto-purged on read).
"""
import json
import time
from datetime import datetime, timedelta
from typing import Optional
from db.supabase_client import get_supabase
from models.schemas import SessionData

TTL_SECONDS = 86400  # 24 hours


def _supabase_to_session(data: dict) -> Optional[SessionData]:
    """Convert Supabase row to SessionData."""
    if not data:
        return None
    try:
        # Parse the JSONB data field
        session_data = data.get("data", {})
        return SessionData(**session_data)
    except Exception:
        return None


def _session_to_dict(session: SessionData) -> dict:
    """Convert SessionData to dict for storage."""
    return {
        "session_id": session.session_id,
        "user_id": getattr(session, "user_id", None),
        "data": session.model_dump(),
        "saved_at": datetime.now().isoformat(),
    }


def save_session(session: SessionData) -> bool:
    """Save session to Supabase. Returns True if successful."""
    supabase = get_supabase()
    if not supabase:
        return False
    
    try:
        payload = _session_to_dict(session)
        
        # Upsert: insert if not exists, update if exists
        supabase.table("sessions").upsert(
            payload,
            on_conflict="session_id"
        ).execute()
        return True
    except Exception as e:
        print(f"[SessionStore] Save failed: {e}")
        return False


def load_session(session_id: str) -> Optional[SessionData]:
    """Load session from Supabase with TTL check."""
    supabase = get_supabase()
    if not supabase:
        return None
    
    try:
        result = supabase.table("sessions").select("*").eq("session_id", session_id).execute()
        
        if not result.data:
            return None
        
        row = result.data[0]
        
        # TTL check
        saved_at = row.get("saved_at")
        if saved_at:
            try:
                saved_time = datetime.fromisoformat(saved_at)
                if datetime.now() - saved_time > timedelta(seconds=TTL_SECONDS):
                    # Expired - delete it
                    delete_session(session_id)
                    return None
            except (ValueError, TypeError):
                pass
        
        return _supabase_to_session(row)
    except Exception as e:
        print(f"[SessionStore] Load failed: {e}")
        return None


def delete_session(session_id: str) -> bool:
    """Delete session from Supabase."""
    supabase = get_supabase()
    if not supabase:
        return False
    
    try:
        supabase.table("sessions").delete().eq("session_id", session_id).execute()
        return True
    except Exception as e:
        print(f"[SessionStore] Delete failed: {e}")
        return False


def purge_expired() -> int:
    """Delete expired sessions from Supabase. Returns count removed."""
    supabase = get_supabase()
    if not supabase:
        return 0
    
    try:
        cutoff = (datetime.now() - timedelta(seconds=TTL_SECONDS)).isoformat()
        result = supabase.table("sessions").delete().lt("saved_at", cutoff).execute()
        return len(result.data) if result.data else 0
    except Exception as e:
        print(f"[SessionStore] Purge failed: {e}")
        return 0


def list_user_sessions(user_id: str) -> list[SessionData]:
    """List all sessions for a specific user."""
    supabase = get_supabase()
    if not supabase:
        return []
    
    try:
        result = supabase.table("sessions").select("*").eq("user_id", user_id).execute()
        sessions = []
        for row in result.data or []:
            session = _supabase_to_session(row)
            if session:
                sessions.append(session)
        return sessions
    except Exception as e:
        print(f"[SessionStore] List failed: {e}")
        return []
