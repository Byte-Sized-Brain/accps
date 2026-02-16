from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Content(db.Model):
    __tablename__ = "content"

    id = db.Column(db.Integer, primary_key=True)
    firebase_uid = db.Column(db.String(128), nullable=True, index=True)
    fingerprint = db.Column(db.String(128), unique=True, nullable=False, index=True)
    content_type = db.Column(db.String(10), nullable=False)  # "text" or "image"
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200), default="")
    owner_address = db.Column(db.String(42), nullable=False)
    owner_email = db.Column(db.String(120), nullable=True)
    text_content = db.Column(db.Text, nullable=True)       # stored for TF-IDF comparison
    image_phash = db.Column(db.String(64), nullable=True)   # perceptual hash for image similarity
    file_path = db.Column(db.String(500), nullable=True)
    tx_hash = db.Column(db.String(66), nullable=True)
    ipfs_hash = db.Column(db.String(128), nullable=True)
    ipfs_url = db.Column(db.String(256), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "fingerprint": self.fingerprint,
            "content_type": self.content_type,
            "title": self.title,
            "description": self.description,
            "owner_address": self.owner_address,
            "owner_email": self.owner_email,
            "tx_hash": self.tx_hash,
            "ipfs_hash": self.ipfs_hash,
            "ipfs_url": self.ipfs_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "has_text": self.text_content is not None,
            "image_phash": self.image_phash,
        }
