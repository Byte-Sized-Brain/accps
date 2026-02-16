import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import imagehash
import torch
import torchvision.transforms as transforms
import torchvision.models as models
from sentence_transformers import SentenceTransformer
from PIL import Image

from models import Content, db
from config import SIMILARITY_THRESHOLD_TEXT, SIMILARITY_THRESHOLD_IMAGE

# ── Lazy-loaded models (loaded once on first use) ────────────────

_sentence_model = None
_resnet_model = None
_image_transform = None


def _get_sentence_model():
    global _sentence_model
    if _sentence_model is None:
        print("[PLAGIARISM] Loading sentence transformer model...")
        _sentence_model = SentenceTransformer("all-MiniLM-L6-v2")
        print("[PLAGIARISM] Sentence model loaded.")
    return _sentence_model


def _get_resnet():
    global _resnet_model, _image_transform
    if _resnet_model is None:
        print("[PLAGIARISM] Loading ResNet50 for image features...")
        resnet = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
        # Remove the final classification layer — we want feature vectors
        _resnet_model = torch.nn.Sequential(*list(resnet.children())[:-1])
        _resnet_model.eval()
        _image_transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ])
        print("[PLAGIARISM] ResNet50 loaded.")
    return _resnet_model, _image_transform


def _extract_image_features(image_path: str) -> np.ndarray:
    """Extract a 2048-dim feature vector from an image using ResNet50."""
    model, transform = _get_resnet()
    img = Image.open(image_path).convert("RGB")
    tensor = transform(img).unsqueeze(0)
    with torch.no_grad():
        features = model(tensor).squeeze().numpy()
    # L2 normalize
    norm = np.linalg.norm(features)
    if norm > 0:
        features = features / norm
    return features


# ── Text Plagiarism Detection ────────────────────────────────────

def check_text_plagiarism(query_text: str) -> list[dict]:
    """
    Two-pass text plagiarism detection:
      1. TF-IDF cosine similarity (keyword overlap — fast)
      2. Sentence transformer semantic similarity (catches paraphrasing)
    Returns the higher score of the two for each registered item.
    """
    registered = Content.query.filter_by(content_type="text").all()
    if not registered:
        return []

    corpus_texts = [r.text_content for r in registered]

    # ── Pass 1: TF-IDF (keyword-level) ──
    all_texts = corpus_texts + [query_text]
    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf_matrix = vectorizer.fit_transform(all_texts)
    tfidf_scores = cosine_similarity(tfidf_matrix[-1], tfidf_matrix[:-1]).flatten()

    # ── Pass 2: Semantic similarity (meaning-level) ──
    model = _get_sentence_model()
    query_embedding = model.encode([query_text], normalize_embeddings=True)
    corpus_embeddings = model.encode(corpus_texts, normalize_embeddings=True)
    semantic_scores = cosine_similarity(query_embedding, corpus_embeddings).flatten()

    # ── Combine: take the max of both passes ──
    matches = []
    for i in range(len(registered)):
        tfidf_pct = float(tfidf_scores[i]) * 100
        semantic_pct = float(semantic_scores[i]) * 100
        combined = max(tfidf_pct, semantic_pct)

        if combined >= SIMILARITY_THRESHOLD_TEXT * 100:
            matches.append({
                "fingerprint": registered[i].fingerprint,
                "title": registered[i].title,
                "owner": registered[i].owner_address,
                "similarity_score": round(combined, 2),
                "tfidf_score": round(tfidf_pct, 2),
                "semantic_score": round(semantic_pct, 2),
                "content_type": "text",
                "method": "tfidf" if tfidf_pct >= semantic_pct else "semantic",
            })

    matches.sort(key=lambda x: x["similarity_score"], reverse=True)
    return matches


# ── Image Plagiarism Detection ───────────────────────────────────

def check_image_plagiarism(query_phash_str: str, query_image_path: str = None) -> list[dict]:
    """
    Two-pass image plagiarism detection:
      1. Perceptual hash (pHash) hamming distance — fast, catches resizes/crops
      2. ResNet50 CNN feature cosine similarity — catches edits, filters, style changes
    """
    registered = Content.query.filter(
        Content.content_type == "image",
        Content.image_phash.isnot(None),
    ).all()

    if not registered:
        return []

    query_hash = imagehash.hex_to_hash(query_phash_str)

    # ── Pass 1: Perceptual hash ──
    phash_results = {}
    for record in registered:
        stored_hash = imagehash.hex_to_hash(record.image_phash)
        distance = query_hash - stored_hash
        phash_similarity = round((1 - distance / 64) * 100, 2)
        phash_results[record.fingerprint] = {
            "phash_score": phash_similarity,
            "hamming_distance": distance,
        }

    # ── Pass 2: CNN features (if query image path available) ──
    cnn_results = {}
    if query_image_path:
        try:
            query_features = _extract_image_features(query_image_path)
            for record in registered:
                if record.file_path:
                    try:
                        stored_features = _extract_image_features(record.file_path)
                        similarity = float(np.dot(query_features, stored_features)) * 100
                        cnn_results[record.fingerprint] = round(max(0, similarity), 2)
                    except Exception:
                        pass
        except Exception:
            pass

    # ── Combine results ──
    matches = []
    for record in registered:
        fp = record.fingerprint
        phash_score = phash_results.get(fp, {}).get("phash_score", 0)
        cnn_score = cnn_results.get(fp, 0)
        combined = max(phash_score, cnn_score)
        hamming = phash_results.get(fp, {}).get("hamming_distance", 64)

        threshold_pct = (1 - SIMILARITY_THRESHOLD_IMAGE / 64) * 100
        if combined >= threshold_pct:
            matches.append({
                "fingerprint": fp,
                "title": record.title,
                "owner": record.owner_address,
                "similarity_score": round(combined, 2),
                "phash_score": round(phash_score, 2),
                "cnn_score": round(cnn_score, 2),
                "hamming_distance": hamming,
                "content_type": "image",
                "method": "phash" if phash_score >= cnn_score else "cnn",
            })

    matches.sort(key=lambda x: x["similarity_score"], reverse=True)
    return matches
