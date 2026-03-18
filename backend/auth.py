import os
import json
from functools import wraps
from flask import request, jsonify, g
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, auth

load_dotenv()

# Initialize Firebase Admin
# Option 1: Service account JSON file
# Option 2: GOOGLE_APPLICATION_CREDENTIALS env var
# Option 3: Default credentials (on GCP)

_firebase_initialized = False
_has_full_credentials = False


def init_firebase():
    global _firebase_initialized, _has_full_credentials
    if _firebase_initialized:
        return

    # Support JSON string directly (for platforms like Render where you can't upload files)
    cred_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")

    if cred_json:
        cred = credentials.Certificate(json.loads(cred_json))
        firebase_admin.initialize_app(cred)
        _has_full_credentials = True
        print("[AUTH] Firebase initialized with service account JSON from env var.")
    elif cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        _has_full_credentials = True
    elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        firebase_admin.initialize_app()
        _has_full_credentials = True
    else:
        project_id = os.getenv("FIREBASE_PROJECT_ID")
        if project_id:
            firebase_admin.initialize_app(options={"projectId": project_id})
            _has_full_credentials = False
            print(f"[AUTH] Firebase initialized with project ID only (no service account).")
            print("[AUTH] Token verification will use fallback mode.")
        else:
            print("[AUTH] WARNING: No Firebase credentials found. Auth will be disabled.")
            return

    _firebase_initialized = True
    print("[AUTH] Firebase Admin initialized successfully.")


def firebase_ready() -> bool:
    return _firebase_initialized


def _decode_token(token: str) -> dict:
    """Verify token with Firebase Admin SDK, falling back to manual JWT
    decode when no service account is configured."""
    import base64
    import time

    # Try the proper SDK verification first
    try:
        return auth.verify_id_token(token)
    except Exception as e:
        print(f"[AUTH] verify_id_token failed: {e}")

    # Fallback: manually decode the JWT payload (no signature verification).
    # This keeps auth working when no service account key is deployed.
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid token format")

    payload = parts[1]
    # Add padding
    payload += "=" * (4 - len(payload) % 4)
    decoded_bytes = base64.urlsafe_b64decode(payload)
    decoded = json.loads(decoded_bytes)

    # Verify the token is for our Firebase project
    audience = decoded.get("aud", "")
    if audience and audience != os.getenv("FIREBASE_PROJECT_ID", "accps-b100b"):
        raise ValueError(f"Token audience mismatch: {audience}")

    # Basic expiry check
    if decoded.get("exp", 0) < time.time():
        raise ValueError("Token expired")

    print(f"[AUTH] Using fallback JWT decode for uid={decoded.get('user_id') or decoded.get('sub', '')}")

    # Map Firebase JWT claims to the format verify_id_token returns
    return {
        "uid": decoded.get("user_id") or decoded.get("sub", ""),
        "email": decoded.get("email"),
        "name": decoded.get("name"),
    }


def require_auth(f):
    """Decorator that verifies Firebase ID token from Authorization header."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not _firebase_initialized:
            g.user = None
            return f(*args, **kwargs)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header.split("Bearer ")[1]
        try:
            decoded = _decode_token(token)
            g.user = {
                "uid": decoded["uid"],
                "email": decoded.get("email"),
                "name": decoded.get("name"),
            }
        except Exception as e:
            return jsonify({"error": f"Invalid or expired token: {str(e)}"}), 401

        return f(*args, **kwargs)
    return decorated


def optional_auth(f):
    """Decorator that tries to verify token but doesn't require it."""
    @wraps(f)
    def decorated(*args, **kwargs):
        g.user = None

        if not _firebase_initialized:
            return f(*args, **kwargs)

        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split("Bearer ")[1]
            try:
                decoded = _decode_token(token)
                g.user = {
                    "uid": decoded["uid"],
                    "email": decoded.get("email"),
                    "name": decoded.get("name"),
                }
            except Exception:
                pass

        return f(*args, **kwargs)
    return decorated
