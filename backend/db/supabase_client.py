import uuid
import os
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_ANON_KEY

def get_supabase() -> Client | None:
    """Returns a Supabase client if configured, else None."""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        return None
    try:
        return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    except Exception as e:
        print(f"Warning: Could not initialize Supabase client: {e}")
        return None
