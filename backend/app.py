import os
import sys
import uuid

from flask import Flask, request, jsonify, g
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Add backend dir to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from config import (
    UPLOAD_FOLDER,
    MAX_CONTENT_LENGTH,
    ALLOWED_IMAGE_EXTENSIONS,
    DATABASE_URI,
)
from models import db, Content
from fingerprint import (
    generate_text_fingerprint,
    generate_image_fingerprint,
    generate_image_phash,
)
from plagiarism import check_text_plagiarism, check_image_plagiarism
from web_scanner import scan_web_for_text
from ipfs_storage import pin_file as ipfs_pin_file, pin_json as ipfs_pin_json, is_configured as ipfs_configured
from blockchain_client import BlockchainClient
from auth import init_firebase, require_auth, optional_auth, firebase_ready

app = Flask(__name__, static_folder=None)
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URI
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
CORS(app, origins=cors_origins, allow_headers=["Authorization", "Content-Type"], supports_credentials=True)
db.init_app(app)
blockchain = BlockchainClient()

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

with app.app_context():
    db.create_all()


@app.after_request
def add_cache_headers(response):
    """Prevent browsers/CDNs from caching API responses (avoids 304s)."""
    if request.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

# Initialize Firebase
init_firebase()


def allowed_image(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS


# ── Auth routes ──────────────────────────────────────────────────

@app.route("/api/auth/me", methods=["GET"])
@require_auth
def get_me():
    """Get current user info from Firebase token."""
    if not g.user:
        return jsonify({"user": None, "authenticated": False})

    # Count user's registered content
    content_count = Content.query.filter_by(firebase_uid=g.user["uid"]).count()

    return jsonify({
        "authenticated": True,
        "user": {
            "uid": g.user["uid"],
            "email": g.user["email"],
            "name": g.user.get("name"),
            "content_count": content_count,
        },
    })


# ── API routes ───────────────────────────────────────────────────

@app.route("/api/register", methods=["POST"])
@require_auth
def register_content():
    """Register new content: generate fingerprint, store on-chain, save locally."""
    content_type = request.form.get("content_type", "").strip()
    title = request.form.get("title", "").strip()
    description = request.form.get("description", "").strip()

    if content_type not in ("text", "image"):
        return jsonify({"error": "content_type must be 'text' or 'image'"}), 400
    if not title:
        return jsonify({"error": "Title is required"}), 400

    fingerprint = None
    text_content = None
    image_phash = None
    file_path = None

    if content_type == "text":
        text_content = request.form.get("text_content", "").strip()
        if not text_content:
            return jsonify({"error": "Text content is required"}), 400
        fingerprint = generate_text_fingerprint(text_content)

    elif content_type == "image":
        file = request.files.get("file")
        if not file or file.filename == "":
            return jsonify({"error": "Image file is required"}), 400
        if not allowed_image(file.filename):
            return jsonify({"error": f"Allowed image types: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"}), 400

        filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)

        fingerprint = generate_image_fingerprint(file_path)
        image_phash = generate_image_phash(file_path)

    print(f"[REGISTER] Starting registration: type={content_type}, title={title}, fingerprint={fingerprint}")

    # Check if already registered locally
    existing = Content.query.filter_by(fingerprint=fingerprint).first()
    if existing:
        return jsonify({
            "error": "Content already registered",
            "existing_record": existing.to_dict(),
        }), 409

    # Register on blockchain (with timeout protection)
    tx_hash = None
    blockchain_error = None
    if blockchain.is_configured:
        try:
            print("[REGISTER] Checking blockchain for existing record...")
            if blockchain.check_exists(fingerprint):
                return jsonify({"error": "Content already registered on blockchain"}), 409
            print("[REGISTER] Sending blockchain transaction...")
            tx_hash = blockchain.register_content(fingerprint, content_type, title, description)
            print(f"[REGISTER] Blockchain tx confirmed: {tx_hash}")
        except Exception as e:
            blockchain_error = str(e)
            print(f"[REGISTER] Blockchain error (continuing without): {e}")
    else:
        blockchain_error = "Blockchain not configured. Content saved locally only."

    # Get user info
    user_email = g.user["email"] if g.user else None
    firebase_uid = g.user["uid"] if g.user else None

    # Upload to IPFS via Pinata
    ipfs_hash = None
    ipfs_url = None
    ipfs_error = None
    if ipfs_configured():
        try:
            print("[REGISTER] Uploading to IPFS...")
            if content_type == "image" and file_path:
                ipfs_result = ipfs_pin_file(file_path, metadata={
                    "title": title,
                    "fingerprint": fingerprint,
                    "content_type": content_type,
                })
                ipfs_hash = ipfs_result["ipfs_hash"]
                ipfs_url = ipfs_result["ipfs_url"]
            elif content_type == "text" and text_content:
                ipfs_result = ipfs_pin_json({
                    "title": title,
                    "description": description,
                    "content": text_content,
                    "fingerprint": fingerprint,
                }, name=title or "text_content")
                ipfs_hash = ipfs_result["ipfs_hash"]
                ipfs_url = ipfs_result["ipfs_url"]
            print(f"[REGISTER] IPFS upload done: {ipfs_hash}")
        except Exception as e:
            ipfs_error = str(e)
            print(f"[REGISTER] IPFS error (continuing without): {e}")
    else:
        ipfs_error = "IPFS not configured. Set PINATA_API_KEY and PINATA_SECRET_KEY."

    print("[REGISTER] Saving to database...")
    # Save to local database
    record = Content(
        firebase_uid=firebase_uid,
        fingerprint=fingerprint,
        content_type=content_type,
        title=title,
        description=description,
        owner_address=blockchain.account.address if blockchain.account else "local",
        owner_email=user_email,
        text_content=text_content,
        image_phash=image_phash,
        file_path=file_path,
        tx_hash=tx_hash,
        ipfs_hash=ipfs_hash,
        ipfs_url=ipfs_url,
    )
    db.session.add(record)
    db.session.commit()

    response = {
        "status": "registered",
        "fingerprint": fingerprint,
        "tx_hash": tx_hash,
        "ipfs_hash": ipfs_hash,
        "ipfs_url": ipfs_url,
        "record": record.to_dict(),
    }
    if blockchain_error:
        response["blockchain_warning"] = blockchain_error
    if ipfs_error:
        response["ipfs_warning"] = ipfs_error
    if tx_hash:
        response["etherscan_url"] = f"https://sepolia.etherscan.io/tx/0x{tx_hash}" if not tx_hash.startswith("0x") else f"https://sepolia.etherscan.io/tx/{tx_hash}"

    return jsonify(response), 201


@app.route("/api/records", methods=["GET"])
@optional_auth
def list_records():
    """List all registered content records."""
    records = Content.query.order_by(Content.created_at.desc()).all()
    return jsonify({"records": [r.to_dict() for r in records]})


@app.route("/api/my-records", methods=["GET"])
@require_auth
def my_records():
    """List content registered by the current user."""
    if not g.user:
        return jsonify({"records": []})

    records = Content.query.filter_by(firebase_uid=g.user["uid"]).order_by(Content.created_at.desc()).all()
    return jsonify({"records": [r.to_dict() for r in records]})


@app.route("/api/records/<fingerprint>", methods=["GET"])
@optional_auth
def get_record(fingerprint):
    """Get a specific content record by fingerprint."""
    record = Content.query.filter_by(fingerprint=fingerprint).first()
    if not record:
        return jsonify({"error": "Record not found"}), 404

    response = {"record": record.to_dict()}

    # Also check on-chain if configured
    if blockchain.is_configured:
        chain_record = blockchain.get_record(fingerprint)
        if chain_record:
            response["blockchain_record"] = chain_record

    return jsonify(response)


@app.route("/api/check-plagiarism", methods=["POST"])
@require_auth
def check_plagiarism():
    """Check uploaded content for plagiarism against registered content."""
    content_type = request.form.get("content_type", "").strip()

    if content_type not in ("text", "image"):
        return jsonify({"error": "content_type must be 'text' or 'image'"}), 400

    fingerprint = None
    matches = []

    if content_type == "text":
        text_content = request.form.get("text_content", "").strip()
        if not text_content:
            return jsonify({"error": "Text content is required"}), 400

        fingerprint = generate_text_fingerprint(text_content)
        matches = check_text_plagiarism(text_content)

    elif content_type == "image":
        file = request.files.get("file")
        if not file or file.filename == "":
            return jsonify({"error": "Image file is required"}), 400
        if not allowed_image(file.filename):
            return jsonify({"error": f"Allowed types: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"}), 400

        filename = f"check_{uuid.uuid4().hex}_{secure_filename(file.filename)}"
        temp_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(temp_path)

        fingerprint = generate_image_fingerprint(temp_path)
        phash = generate_image_phash(temp_path)
        matches = check_image_plagiarism(phash, query_image_path=temp_path)

        # Clean up temp file
        os.remove(temp_path)

    # Check for exact match in registry
    exact_match = Content.query.filter_by(fingerprint=fingerprint).first()

    # Web scan for text content
    web_results = None
    if content_type == "text":
        try:
            text_content = request.form.get("text_content", "").strip()
            web_results = scan_web_for_text(text_content)
        except Exception:
            web_results = {"queries_searched": 0, "pages_checked": 0, "matches": []}

    is_plagiarized = (
        exact_match is not None
        or len(matches) > 0
        or (web_results and len(web_results.get("matches", [])) > 0)
    )

    return jsonify({
        "fingerprint": fingerprint,
        "exact_match": exact_match.to_dict() if exact_match else None,
        "similar_content": matches,
        "web_results": web_results,
        "is_plagiarized": is_plagiarized,
    })


@app.route("/api/web-scan", methods=["POST"])
@require_auth
def web_scan():
    """Standalone web scan — search the internet for copies of text content."""
    text_content = request.form.get("text_content", "").strip()
    if not text_content:
        return jsonify({"error": "Text content is required"}), 400

    try:
        results = scan_web_for_text(text_content)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/verify/<fingerprint>", methods=["GET"])
def verify_ownership(fingerprint):
    """Verify content ownership on the blockchain."""
    if not blockchain.is_configured:
        return jsonify({"error": "Blockchain not configured"}), 503

    chain_record = blockchain.get_record(fingerprint)
    local_record = Content.query.filter_by(fingerprint=fingerprint).first()

    return jsonify({
        "fingerprint": fingerprint,
        "on_chain": chain_record is not None,
        "blockchain_record": chain_record,
        "local_record": local_record.to_dict() if local_record else None,
    })


@app.route("/api/status", methods=["GET"])
def status():
    """System status check."""
    return jsonify({
        "status": "running",
        "blockchain_configured": blockchain.is_configured,
        "blockchain_connected": blockchain.w3.is_connected() if blockchain.w3 else False,
        "firebase_configured": firebase_ready(),
        "ipfs_configured": ipfs_configured(),
        "total_records": Content.query.count(),
    })


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
