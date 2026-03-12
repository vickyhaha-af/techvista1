"""
Authentication middleware and utilities using Supabase Auth.
Validates JWT tokens from the frontend and extracts user info.
"""
import os
from fastapi import Request, HTTPException
from typing import Optional
import jwt
from datetime import datetime

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")


async def get_current_user(request: Request) -> Optional[dict]:
    """
    Extract and validate JWT token from Authorization header.
    Returns user dict with 'id', 'email' if valid, None if no token.
    Raises HTTPException if token is invalid.
    """
    auth_header = request.headers.get("Authorization")
    
    if not auth_header:
        return None
    
    # Bearer token format: "Bearer <token>"
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    token = parts[1]
    
    try:
        # Verify JWT with Supabase secret
        if not SUPABASE_JWT_SECRET:
            # Development mode - accept any token format
            # In production, SUPABASE_JWT_SECRET must be set
            payload = jwt.decode(token, options={"verify_signature": False}, algorithms=["HS256"])
        else:
            payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
        
        # Extract user info from JWT payload
        user = {
            "id": payload.get("sub"),  # Supabase user ID
            "email": payload.get("email"),
            "role": payload.get("role", "authenticated"),
        }
        
        # Store in request state for later use
        request.state.user = user
        return user
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


async def require_auth(request: Request) -> dict:
    """
    Require authentication - raises 401 if no valid user.
    Use as FastAPI dependency.
    """
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


def check_session_ownership(session, user_id: str) -> bool:
    """
    Check if a session belongs to the requesting user.
    - If session has no user_id (legacy/demo), allow access
    - If session has user_id, must match
    """
    if not session:
        return False
    
    session_owner = getattr(session, "user_id", None)
    
    # Legacy/demo sessions without user_id are accessible to all
    if not session_owner:
        return True
    
    return session_owner == user_id
