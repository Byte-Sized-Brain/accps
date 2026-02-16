import os
from functools import wraps
from flask import request, jsonify, g
import firebase_admin
from firebase_admin import credentials, auth

# Initialize Firebase Admin
# Option 1: Service account JSON file
# Option 2: GOOGLE_APPLICATION_CREDENTIALS env var
# Option 3: Default credentials (on GCP)

_firebase_initialized = False


def init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return

    cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        firebase_admin.initialize_app()
    else:
        # Initialize without credentials — will only work for ID token verification
        # if FIREBASE_PROJECT_ID is set
        project_id = os.getenv("FIREBASE_PROJECT_ID")
        if project_id:
            firebase_admin.initialize_app(options={"projectId": project_id})
        else:
            print("[AUTH] WARNING: No Firebase credentials found. Auth will be disabled.")
            return

    _firebase_initialized = True
    print("[AUTH] Firebase Admin initialized successfully.")


def firebase_ready() -> bool:
    return _firebase_initialized


def require_auth(f):
    """Decorator that verifies Firebase ID token from Authorization header."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not _firebase_initialized:
            # Auth not configured — allow requests through with no user info
            g.user = None
            return f(*args, **kwargs)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header.split("Bearer ")[1]
        try:
            decoded = auth.verify_id_token(token)
            g.user = {
                "uid": decoded["uid"],
                "email": decoded.get("email"),
                "name": decoded.get("name"),
            }
        except Exception:
            return jsonify({"error": "Invalid or expired token"}), 401

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
                decoded = auth.verify_id_token(token)
                g.user = {
                    "uid": decoded["uid"],
                    "email": decoded.get("email"),
                    "name": decoded.get("name"),
                }
            except Exception:
                pass  # Token invalid, continue as anonymous

        return f(*args, **kwargs)
    return decorated
