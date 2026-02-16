import os
import json
from dotenv import load_dotenv

load_dotenv()

# Blockchain
SEPOLIA_RPC_URL = os.getenv("SEPOLIA_RPC_URL", "https://rpc.sepolia.org")
PRIVATE_KEY = os.getenv("PRIVATE_KEY", "")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "")

# Load ABI from file
ABI_PATH = os.path.join(os.path.dirname(__file__), "contract_abi.json")
if os.path.exists(ABI_PATH):
    with open(ABI_PATH, "r") as f:
        CONTRACT_ABI = json.load(f)
else:
    CONTRACT_ABI = []

# Plagiarism thresholds
SIMILARITY_THRESHOLD_TEXT = float(os.getenv("SIMILARITY_THRESHOLD_TEXT", "0.8"))
SIMILARITY_THRESHOLD_IMAGE = int(os.getenv("SIMILARITY_THRESHOLD_IMAGE", "10"))

# Upload settings
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "bmp", "webp"}

# Database
DATABASE_URI = os.getenv("DATABASE_URI", "sqlite:///content_registry.db")

# Firebase Auth
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "accps-b100b")
