import hashlib
import imagehash
from PIL import Image


def generate_text_fingerprint(text: str) -> str:
    """Generate a SHA-256 fingerprint from text content.

    Normalizes the text (lowercase, stripped whitespace) before hashing
    to ensure consistent fingerprints for equivalent content.
    """
    normalized = " ".join(text.lower().split())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def generate_image_fingerprint(image_path: str) -> str:
    """Generate a SHA-256 fingerprint from image file bytes.

    This is the exact-match fingerprint stored on-chain.
    """
    sha256 = hashlib.sha256()
    with open(image_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def generate_image_phash(image_path: str) -> str:
    """Generate a perceptual hash for image similarity comparison.

    Stored locally (not on-chain) for similarity detection.
    """
    img = Image.open(image_path)
    return str(imagehash.phash(img))
