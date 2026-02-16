# ACCPS — AI Content Copyright Protection System
## Project Implementation Document

---

## 1. What Is This Project?

ACCPS is a web application that helps creators (writers, artists, journalists, researchers) **protect their digital content from being copied or plagiarized**.

It combines three technologies:
- **Blockchain** — to create a permanent, tamper-proof record of who owns what content and when it was registered
- **AI / Machine Learning** — to detect if someone has copied or paraphrased your content
- **IPFS (Decentralized Storage)** — to store the actual content files permanently on a distributed network

Think of it like a **digital notary** — you upload your work, the system creates a unique fingerprint, stores it on the blockchain as proof of ownership, and then uses AI to scan for anyone who might have copied it.

---

## 2. The Problem We're Solving

- A journalist writes an article. Another website copies it word-for-word and publishes it as their own.
- A digital artist uploads an image. Someone applies a filter, crops it slightly, and sells it.
- A researcher publishes a paper. Another researcher paraphrases it and submits it elsewhere.

**Current solutions fail because:**
- Copyright registration is slow, expensive, and centralized
- Simple text matching (like copy-paste detection) doesn't catch paraphrasing
- Image matching doesn't catch edited/filtered copies
- There's no single source of truth for "who published this first"

**Our solution:**
- Registration is instant, cheap (testnet), and stored on a public blockchain anyone can verify
- AI detects both exact copies AND paraphrased/edited content
- The blockchain timestamp is immutable proof of when you registered

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│  Login/Signup → Register Content → Check Plagiarism → Registry  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API calls
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Flask / Python)                    │
│                                                                  │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Firebase  │  │ Fingerprint  │  │ AI/ML    │  │ Web        │  │
│  │ Auth      │  │ Generator    │  │ Engine   │  │ Scanner    │  │
│  └──────────┘  └──────────────┘  └──────────┘  └────────────┘  │
│                                                                  │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ SQLite   │  │ Blockchain   │  │ IPFS Storage (Pinata)    │  │
│  │ Database │  │ Client       │  │                          │  │
│  └──────────┘  └──────┬───────┘  └────────────┬─────────────┘  │
└──────────────────────┬─┼──────────────────────┬┘               │
                       │ │                      │                  │
                       ▼ ▼                      ▼                  │
              ┌──────────────┐        ┌──────────────┐            │
              │   Sepolia    │        │    IPFS      │            │
              │  Blockchain  │        │   Network    │            │
              │  (Ethereum)  │        │  (Pinata)    │            │
              └──────────────┘        └──────────────┘
```

---

## 4. Tech Stack

| Layer | Technology | Why We Chose It |
|-------|-----------|----------------|
| **Frontend** | Next.js 16, React, TypeScript, Tailwind CSS | Modern, fast, SEO-friendly, great developer experience |
| **UI Animations** | Framer Motion | Smooth page transitions and interactive elements |
| **Authentication** | Firebase Auth | Google sign-in + email/password, handles security for us |
| **Backend** | Python Flask | Simple, fast to build, great ML library ecosystem |
| **Database** | SQLite + SQLAlchemy | Lightweight, no setup needed, good for prototyping |
| **Blockchain** | Solidity smart contract on Sepolia (Ethereum testnet) | Immutable, public, verifiable ownership records |
| **Blockchain Interaction** | Web3.py | Python library to talk to Ethereum smart contracts |
| **IPFS Storage** | Pinata | Easy API for pinning files to IPFS, permanent decentralized storage |
| **Text AI** | Sentence Transformers (all-MiniLM-L6-v2) + TF-IDF | Detects both keyword copies and semantic paraphrasing |
| **Image AI** | ResNet50 (CNN) + Perceptual Hashing | Detects visual similarity even with edits, filters, crops |
| **Web Scanning** | BeautifulSoup + Google Search | Finds copies of your content published on other websites |

---

## 5. How Each Part Works

### 5.1 Content Registration Flow

When a user uploads content to register it, here's what happens step by step:

```
User uploads text or image
        │
        ▼
Step 1: Generate SHA-256 fingerprint
        │  (a unique 64-character hash of the content)
        ▼
Step 2: Check if fingerprint already exists
        │  (in local DB + on blockchain)
        ▼
Step 3: Upload to IPFS via Pinata
        │  (permanent decentralized storage, returns CID)
        ▼
Step 4: Register on Blockchain
        │  (sends transaction to Sepolia, stores fingerprint + metadata)
        ▼
Step 5: Save to local SQLite database
        │  (for fast searching and AI comparison later)
        ▼
Done → User gets: fingerprint, tx hash, IPFS link, Etherscan link
```

### 5.2 Content Fingerprinting

**What is a fingerprint?**
A fingerprint is a unique identifier for a piece of content, generated using the SHA-256 hashing algorithm.

- **For text:** We normalize the text (lowercase, remove extra spaces), then compute SHA-256
- **For images:** We read the raw file bytes and compute SHA-256

**Key property:** If even one character or pixel changes, the hash is completely different. This makes it perfect for proving "this exact content existed at this time."

```python
# Example: Text fingerprinting
import hashlib

text = "This is my original article about climate change."
normalized = " ".join(text.lower().split())
fingerprint = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
# Result: "a7f3b8c1d2e4f5..." (64 hex characters)
```

### 5.3 Blockchain (Smart Contract)

**What is a smart contract?**
A program that runs on the Ethereum blockchain. Once deployed, nobody can change it — not even us. It's public and anyone can verify the data.

**Our contract stores:**
- `fingerprint` — the SHA-256 hash of the content
- `owner` — the wallet address that registered it
- `contentType` — "text" or "image"
- `title` and `description` — metadata
- `timestamp` — when it was registered (set by the blockchain, can't be faked)

**Key functions:**
```solidity
// Register new content
function registerContent(fingerprint, contentType, title, description)

// Check if content exists and who owns it
function getRecord(fingerprint) → returns owner, type, title, timestamp

// Verify someone's ownership claim
function verifyOwnership(fingerprint, claimedOwner) → true/false
```

**Why Sepolia testnet?**
Sepolia is Ethereum's test network. It works exactly like the real Ethereum blockchain but uses free test ETH instead of real money. For a production system, you'd deploy to Ethereum mainnet or a Layer 2 like Polygon.

### 5.4 IPFS Storage (Pinata)

**What is IPFS?**
InterPlanetary File System — a decentralized network for storing files. Instead of files living on one server (that could go down), they're distributed across many nodes worldwide.

**What is Pinata?**
A service that makes it easy to upload files to IPFS. They "pin" your files so they stay available permanently.

**Why we use it:**
- The blockchain only stores the fingerprint (hash), not the actual file (too expensive)
- IPFS stores the actual file permanently
- The IPFS content identifier (CID) is based on the file's hash, so it's tamper-proof
- Anyone can retrieve the file using the CID

**Flow:**
```
Image uploaded → Pinata API → IPFS network → Returns CID (e.g., "bafkrei...")
                                                    │
                                             Stored in our DB
                                             alongside blockchain tx
```

### 5.5 AI Plagiarism Detection

We use a **two-pass detection system** for both text and images.

#### Text Detection

**Pass 1: TF-IDF + Cosine Similarity (Keyword Level)**

TF-IDF (Term Frequency - Inverse Document Frequency) converts text into numerical vectors based on word importance.

```
"The cat sat on the mat"  →  [0.0, 0.4, 0.5, 0.3, ...]
"A cat was sitting on a mat"  →  [0.1, 0.4, 0.45, 0.3, ...]
```

Cosine similarity measures how similar two vectors are (0% = completely different, 100% = identical).

**What it catches:** Direct copies, minor word changes, synonym swaps
**What it misses:** Complete rewrites that change all the words but keep the same meaning

**Pass 2: Sentence Transformers (Semantic Level)**

We use the `all-MiniLM-L6-v2` model — a neural network that understands the **meaning** of text, not just the words.

```
"The economy grew by 3% last quarter"
"GDP increased three percent in Q3"

TF-IDF similarity: ~20% (different words)
Semantic similarity: ~92% (same meaning!)
```

**What it catches:** Paraphrasing, rewording, AI-rewritten content, translations
**How it works:** The model converts each sentence into a 384-dimensional vector that captures its meaning. Similar meanings = vectors pointing in similar directions.

**Combined:** We take the higher score of both passes. This catches both lazy copy-paste AND clever paraphrasing.

#### Image Detection

**Pass 1: Perceptual Hashing (pHash)**

Unlike SHA-256 (which changes completely with any edit), perceptual hashing produces similar hashes for visually similar images.

```
Original image    → pHash: "a4c3f2b1e8d7"
Resized version   → pHash: "a4c3f2b1e8d6"  (very similar!)
Completely different → pHash: "1b2c3d4e5f6a"  (very different)
```

We compare hashes using Hamming distance (how many bits differ).

**What it catches:** Resizing, compression, slight crops, minor color changes
**What it misses:** Heavy edits, filters, artistic modifications

**Pass 2: ResNet50 CNN Features**

ResNet50 is a deep neural network pre-trained on millions of images. We use it to extract a 2048-dimensional "feature vector" — essentially a summary of what the image contains.

```
Photo of a sunset at a beach  →  [0.23, 0.87, 0.12, ...]  (2048 numbers)
Same photo with Instagram filter  →  [0.24, 0.85, 0.13, ...]  (very similar!)
Photo of a city at night  →  [0.91, 0.02, 0.76, ...]  (completely different)
```

**What it catches:** Filters, color grading, watermark removal, style transfers, artistic modifications
**How it works:** We remove the final classification layer of ResNet50 (which normally outputs "cat", "dog", etc.) and instead use the second-to-last layer's output as a rich feature representation.

### 5.6 Web Scanning

When checking text for plagiarism, we also search the internet:

```
Step 1: Extract 3 key sentences from the text
Step 2: Search Google for each sentence (exact phrase match)
Step 3: Fetch the top 5 results for each query
Step 4: Scrape the page content
Step 5: Compare the original text against each page using TF-IDF
Step 6: Return pages with similarity above 30%
```

**What it catches:** Content that's been published on other websites, even if not registered in our system.

### 5.7 Authentication (Firebase)

We use Firebase Authentication because:
- It handles password hashing, session management, and security for us
- Supports multiple sign-in methods (email/password, Google)
- Issues JWT tokens that the backend verifies

**Flow:**
```
User signs in → Firebase returns JWT token
    │
    ▼
Frontend stores token → Sends it with every API request
    │
    ▼
Backend verifies token with Firebase Admin SDK
    │
    ▼
If valid → Process request with user's identity
If invalid → Return 401 Unauthorized
```

---

## 6. Database Schema

```sql
Content Table:
┌─────────────┬──────────┬──────────────────────────────────────┐
│ Column       │ Type     │ Description                          │
├─────────────┼──────────┼──────────────────────────────────────┤
│ id           │ INTEGER  │ Auto-increment primary key           │
│ firebase_uid │ STRING   │ Firebase user ID of the owner        │
│ fingerprint  │ STRING   │ SHA-256 hash (unique, indexed)       │
│ content_type │ STRING   │ "text" or "image"                    │
│ title        │ STRING   │ User-provided title                  │
│ description  │ STRING   │ User-provided description            │
│ owner_address│ STRING   │ Ethereum wallet address              │
│ owner_email  │ STRING   │ User's email from Firebase           │
│ text_content │ TEXT     │ Full text (for AI comparison)        │
│ image_phash  │ STRING   │ Perceptual hash (for image matching) │
│ file_path    │ STRING   │ Local file path for images           │
│ tx_hash      │ STRING   │ Blockchain transaction hash          │
│ ipfs_hash    │ STRING   │ IPFS content identifier (CID)       │
│ ipfs_url     │ STRING   │ Full IPFS gateway URL                │
│ created_at   │ DATETIME │ Registration timestamp               │
└─────────────┴──────────┴──────────────────────────────────────┘
```

**Why SQLite + Blockchain?**
- SQLite is fast for searching and AI comparisons (we need to load all text for TF-IDF)
- Blockchain is the source of truth for ownership and timestamps (can't be tampered with)
- SQLite mirrors blockchain data locally for performance

---

## 7. API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/register` | Required | Register new content (fingerprint + blockchain + IPFS) |
| GET | `/api/records` | Optional | List all registered content |
| GET | `/api/my-records` | Required | List current user's content |
| GET | `/api/records/:fingerprint` | Optional | Get specific record details |
| POST | `/api/check-plagiarism` | Required | Check content against registry + web |
| POST | `/api/web-scan` | Required | Standalone web scan for text |
| GET | `/api/verify/:fingerprint` | Public | Verify on-chain ownership |
| GET | `/api/auth/me` | Required | Get current user info |
| GET | `/api/status` | Public | System health check |

---

## 8. Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Register | Upload and register content (protected) |
| `/check` | Plagiarism Check | Check content for plagiarism (protected) |
| `/registry` | Content Registry | Browse all registered content (public) |
| `/dashboard` | My Content | User's personal dashboard (protected) |
| `/login` | Sign In | Email/password + Google sign-in |
| `/signup` | Create Account | New user registration |

---

## 9. Security Considerations

1. **Private keys** — Stored in `.env` file, never committed to git
2. **Firebase Auth** — Handles password security, brute force protection, session management
3. **Input validation** — Smart contract enforces max lengths, valid content types
4. **CORS** — Backend only accepts requests from the frontend origin
5. **File uploads** — Validated file types, max 16MB, sanitized filenames
6. **Blockchain immutability** — Once registered, records can't be altered or deleted

---

## 10. Limitations & Future Improvements

**Current limitations:**
- Sepolia testnet (not real Ethereum mainnet)
- Web scanning depends on Google search (rate limited)
- AI models run on CPU (slower than GPU)
- SQLite won't scale to millions of records

**Future improvements:**
- Deploy to Ethereum mainnet or Polygon for real-world use
- Add NFT minting (ERC-721) for registered content
- Use a vector database (Pinecone, Weaviate) for faster AI similarity search
- Add audio/video content support
- Build a browser extension that automatically checks web pages for copied content
- Add notification system — alert users when similar content is detected
- DMCA takedown request generation

---

## 11. How to Run the Project

### Prerequisites
- Python 3.11+
- Node.js 18+
- MetaMask wallet with Sepolia test ETH

### Step 1: Deploy Smart Contract
1. Open Remix IDE (remix.ethereum.org)
2. Paste `blockchain/ContentCopyright.sol`
3. Compile with Solidity 0.8.19+
4. Deploy to Sepolia via MetaMask
5. Copy contract address

### Step 2: Configure Backend
```bash
cd backend
cp ../.env.example ../.env
# Fill in: CONTRACT_ADDRESS, PRIVATE_KEY, PINATA_API_KEY, PINATA_SECRET_KEY
pip install -r requirements.txt
python app.py
```

### Step 3: Run Frontend
```bash
cd frontend
npm install
npm run dev
```

### Step 4: Open http://localhost:3000

---

## 12. Key Concepts to Understand for Interview

### What is a hash function?
A function that takes any input and produces a fixed-size output. SHA-256 always produces 64 hex characters. It's one-way (you can't reverse it) and collision-resistant (different inputs produce different outputs).

### What is a blockchain?
A distributed ledger — a database shared across many computers where data can only be added, never modified or deleted. Each block references the previous block, forming a chain.

### What is a smart contract?
A program stored on the blockchain that executes automatically when conditions are met. Like a vending machine — put in the right input, get the guaranteed output. No middleman needed.

### What is IPFS?
A peer-to-peer network for storing files. Files are addressed by their content hash (CID), not their location. This means the same file always has the same address, and you can verify the file hasn't been tampered with.

### What is TF-IDF?
Term Frequency - Inverse Document Frequency. It measures how important a word is in a document relative to a collection of documents. Common words like "the" get low scores. Unique words get high scores. Used to convert text into numerical vectors for comparison.

### What is cosine similarity?
A measure of how similar two vectors are, based on the angle between them. 1.0 = identical direction (same content), 0.0 = perpendicular (completely different).

### What is a sentence transformer?
A neural network that converts sentences into dense vectors (embeddings) that capture their meaning. Sentences with similar meanings have similar vectors, even if they use completely different words.

### What is a CNN (Convolutional Neural Network)?
A type of neural network designed for processing images. It learns to recognize patterns (edges, textures, shapes, objects) through layers of filters. ResNet50 has 50 layers and was trained on millions of images.

### What is perceptual hashing?
A hashing technique that produces similar hashes for visually similar images (unlike cryptographic hashes like SHA-256 which change completely with any modification). Used for fast image similarity detection.

### What is Web3.py?
A Python library for interacting with Ethereum blockchains. It lets you send transactions, call smart contract functions, and read blockchain data from Python code.

### What is Firebase?
Google's backend-as-a-service platform. We use Firebase Authentication, which handles user sign-up, login, password security, and session management so we don't have to build it from scratch.

---

## 13. Project File Structure

```
accps/
├── blockchain/
│   └── ContentCopyright.sol       # Solidity smart contract
│
├── backend/
│   ├── app.py                     # Flask server + all API routes
│   ├── config.py                  # Environment config loader
│   ├── models.py                  # SQLite database models
│   ├── auth.py                    # Firebase token verification
│   ├── fingerprint.py             # SHA-256 + perceptual hashing
│   ├── plagiarism.py              # TF-IDF + Sentence Transformers + ResNet50
│   ├── web_scanner.py             # Google search + web scraping
│   ├── blockchain_client.py       # Web3.py Ethereum interaction
│   ├── ipfs_storage.py            # Pinata IPFS upload
│   ├── contract_abi.json          # Smart contract ABI
│   ├── requirements.txt           # Python dependencies
│   └── .env                       # API keys (not in git)
│
├── frontend/
│   ├── src/
│   │   ├── app/                   # Next.js pages (register, check, registry, etc.)
│   │   ├── components/            # Reusable UI components
│   │   └── lib/
│   │       ├── api.ts             # Backend API client
│   │       ├── firebase.ts        # Firebase config
│   │       └── AuthContext.tsx     # Auth state management
│   └── package.json
│
└── PROJECT_IMPLEMENTATION.md      # This document
```
