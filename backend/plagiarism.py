import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import imagehash

from models import Content, db
from config import SIMILARITY_THRESHOLD_TEXT, SIMILARITY_THRESHOLD_IMAGE


# ── Text Plagiarism Detection ────────────────────────────────────

def check_text_plagiarism(query_text: str) -> list[dict]:
    """
    Text plagiarism detection using TF-IDF cosine similarity.
    Compares the query text against all registered text content
    using keyword-level overlap analysis.
    """
    registered = Content.query.filter_by(content_type="text").all()
    if not registered:
        return []

    corpus_texts = [r.text_content for r in registered]

    all_texts = corpus_texts + [query_text]
    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf_matrix = vectorizer.fit_transform(all_texts)
    tfidf_scores = cosine_similarity(tfidf_matrix[-1], tfidf_matrix[:-1]).flatten()

    matches = []
    for i in range(len(registered)):
        score_pct = float(tfidf_scores[i]) * 100

        if score_pct >= SIMILARITY_THRESHOLD_TEXT * 100:
            matches.append({
                "fingerprint": registered[i].fingerprint,
                "title": registered[i].title,
                "owner": registered[i].owner_address,
                "similarity_score": round(score_pct, 2),
                "tfidf_score": round(score_pct, 2),
                "semantic_score": 0.0,
                "content_type": "text",
                "method": "tfidf",
            })

    matches.sort(key=lambda x: x["similarity_score"], reverse=True)
    return matches


# ── Image Plagiarism Detection ───────────────────────────────────

def check_image_plagiarism(query_phash_str: str, query_image_path: str = None) -> list[dict]:
    """
    Image plagiarism detection using perceptual hash (pHash) hamming distance.
    Catches resizes, crops, minor edits, and recompression.
    """
    registered = Content.query.filter(
        Content.content_type == "image",
        Content.image_phash.isnot(None),
    ).all()

    if not registered:
        return []

    query_hash = imagehash.hex_to_hash(query_phash_str)

    matches = []
    threshold_pct = (1 - SIMILARITY_THRESHOLD_IMAGE / 64) * 100

    for record in registered:
        stored_hash = imagehash.hex_to_hash(record.image_phash)
        distance = query_hash - stored_hash
        phash_similarity = round((1 - distance / 64) * 100, 2)

        if phash_similarity >= threshold_pct:
            matches.append({
                "fingerprint": record.fingerprint,
                "title": record.title,
                "owner": record.owner_address,
                "similarity_score": round(phash_similarity, 2),
                "phash_score": round(phash_similarity, 2),
                "cnn_score": 0.0,
                "hamming_distance": distance,
                "content_type": "image",
                "method": "phash",
            })

    matches.sort(key=lambda x: x["similarity_score"], reverse=True)
    return matches
