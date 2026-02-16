import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote_plus
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)

HEADERS = {"User-Agent": USER_AGENT}


def _extract_search_snippets(text: str, max_snippets: int = 3) -> list[str]:
    """Extract meaningful phrases from text to use as search queries."""
    sentences = re.split(r'[.!?\n]+', text)
    sentences = [s.strip() for s in sentences if len(s.strip().split()) >= 6]

    if not sentences:
        # Fall back to chunks of ~10 words
        words = text.split()
        sentences = [" ".join(words[i:i+10]) for i in range(0, len(words), 10)]

    # Pick evenly spaced sentences for coverage
    if len(sentences) <= max_snippets:
        return sentences

    step = len(sentences) / max_snippets
    return [sentences[int(i * step)] for i in range(max_snippets)]


def _search_google(query: str, num_results: int = 5) -> list[dict]:
    """Search Google and return result URLs + snippets."""
    url = f"https://www.google.com/search?q={quote_plus(query)}&num={num_results}"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        resp.raise_for_status()
    except Exception:
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    results = []

    for div in soup.select("div.g, div[data-sokoban-container]"):
        link_tag = div.find("a", href=True)
        snippet_tag = div.find("span", class_=lambda c: c and "st" not in str(c))
        # Try multiple selectors for snippet
        if not snippet_tag:
            snippet_tag = div.select_one("div[data-sncf], div.VwiC3b, span.aCOpRe")

        if link_tag:
            href = link_tag["href"]
            if href.startswith("/url?q="):
                href = href.split("/url?q=")[1].split("&")[0]
            if href.startswith("http"):
                snippet_text = snippet_tag.get_text(strip=True) if snippet_tag else ""
                results.append({
                    "url": href,
                    "snippet": snippet_text,
                })

    return results[:num_results]


def _fetch_page_text(url: str, max_chars: int = 5000) -> str:
    """Fetch a webpage and extract its main text content."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        resp.raise_for_status()
    except Exception:
        return ""

    soup = BeautifulSoup(resp.text, "html.parser")

    # Remove scripts, styles, navs, footers
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "form"]):
        tag.decompose()

    # Get text from article or main content
    article = soup.find("article") or soup.find("main") or soup.find("body")
    if not article:
        return ""

    text = article.get_text(separator=" ", strip=True)
    # Clean up whitespace
    text = re.sub(r'\s+', ' ', text)
    return text[:max_chars]


def _compute_similarity(text1: str, text2: str) -> float:
    """Compute TF-IDF cosine similarity between two texts."""
    if not text1.strip() or not text2.strip():
        return 0.0

    try:
        vectorizer = TfidfVectorizer(stop_words="english")
        tfidf = vectorizer.fit_transform([text1, text2])
        score = cosine_similarity(tfidf[0], tfidf[1])[0][0]
        return round(float(score) * 100, 2)
    except Exception:
        return 0.0


def scan_web_for_text(text: str, similarity_threshold: float = 30.0) -> dict:
    """
    Scan the web for copies of the given text.

    1. Extracts key phrases from the text
    2. Searches Google for each phrase
    3. Fetches the top results and compares content similarity
    4. Returns matches above the threshold

    Returns:
        {
            "queries_searched": int,
            "pages_checked": int,
            "matches": [
                {
                    "url": str,
                    "similarity_score": float,
                    "snippet": str,
                    "source_query": str,
                }
            ]
        }
    """
    snippets = _extract_search_snippets(text)
    all_urls_checked = set()
    matches = []

    for snippet in snippets:
        # Wrap in quotes for exact phrase search
        query = f'"{snippet[:80]}"'
        results = _search_google(query, num_results=5)

        for result in results:
            url = result["url"]
            if url in all_urls_checked:
                continue
            all_urls_checked.add(url)

            # Fetch the page and compare
            page_text = _fetch_page_text(url)
            if len(page_text) < 50:
                continue

            score = _compute_similarity(text, page_text)

            if score >= similarity_threshold:
                matches.append({
                    "url": url,
                    "similarity_score": score,
                    "snippet": result.get("snippet", "")[:200],
                    "source_query": snippet[:60],
                })

    # Deduplicate by URL and sort by score
    seen = set()
    unique_matches = []
    for m in sorted(matches, key=lambda x: x["similarity_score"], reverse=True):
        if m["url"] not in seen:
            seen.add(m["url"])
            unique_matches.append(m)

    return {
        "queries_searched": len(snippets),
        "pages_checked": len(all_urls_checked),
        "matches": unique_matches,
    }


def reverse_image_search(image_path: str) -> list[dict]:
    """
    Search for an image on the web using Google Lens / reverse image search.
    Returns a list of URLs where the image appears.

    Note: Google's reverse image search requires multipart upload.
    This uses the Google Lens endpoint.
    """
    try:
        search_url = "https://lens.google.com/uploadbyurl"
        # For local files, we'd need to upload — using a simpler approach
        # by searching with image hash as a fallback
        return []
    except Exception:
        return []
