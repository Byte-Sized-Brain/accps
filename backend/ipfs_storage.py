import os
import requests

PINATA_API_KEY = os.getenv("PINATA_API_KEY", "")
PINATA_SECRET_KEY = os.getenv("PINATA_SECRET_KEY", "")
PINATA_BASE_URL = "https://api.pinata.cloud"


def is_configured() -> bool:
    return bool(PINATA_API_KEY and PINATA_SECRET_KEY)


def _headers():
    return {
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_SECRET_KEY,
    }


def pin_file(file_path: str, filename: str = None, metadata: dict = None) -> dict:
    """
    Upload a file to IPFS via Pinata.

    Returns:
        {
            "ipfs_hash": "Qm...",
            "ipfs_url": "https://gateway.pinata.cloud/ipfs/Qm...",
            "pin_size": 12345,
        }
    """
    if not is_configured():
        raise RuntimeError("Pinata not configured. Set PINATA_API_KEY and PINATA_SECRET_KEY.")

    url = f"{PINATA_BASE_URL}/pinning/pinFileToIPFS"

    fname = filename or os.path.basename(file_path)

    with open(file_path, "rb") as f:
        files = {"file": (fname, f)}

        # Optional metadata (name, description, etc.)
        options = {}
        if metadata:
            import json
            options["pinataMetadata"] = json.dumps({
                "name": metadata.get("title", fname),
                "keyvalues": {
                    k: str(v) for k, v in metadata.items()
                },
            })
            options["pinataOptions"] = json.dumps({"cidVersion": 1})

        resp = requests.post(
            url,
            files=files,
            data=options,
            headers=_headers(),
            timeout=60,
        )

    resp.raise_for_status()
    data = resp.json()

    ipfs_hash = data["IpfsHash"]
    return {
        "ipfs_hash": ipfs_hash,
        "ipfs_url": f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}",
        "pin_size": data.get("PinSize", 0),
    }


def pin_json(json_data: dict, name: str = "content_metadata") -> dict:
    """
    Pin JSON metadata to IPFS via Pinata.
    Useful for storing content metadata alongside the file.

    Returns:
        {
            "ipfs_hash": "Qm...",
            "ipfs_url": "https://gateway.pinata.cloud/ipfs/Qm...",
        }
    """
    if not is_configured():
        raise RuntimeError("Pinata not configured.")

    url = f"{PINATA_BASE_URL}/pinning/pinJSONToIPFS"

    payload = {
        "pinataContent": json_data,
        "pinataMetadata": {"name": name},
        "pinataOptions": {"cidVersion": 1},
    }

    resp = requests.post(
        url,
        json=payload,
        headers={**_headers(), "Content-Type": "application/json"},
        timeout=30,
    )

    resp.raise_for_status()
    data = resp.json()

    ipfs_hash = data["IpfsHash"]
    return {
        "ipfs_hash": ipfs_hash,
        "ipfs_url": f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}",
    }


def get_pinned_files() -> list[dict]:
    """List all pinned files on your Pinata account."""
    if not is_configured():
        return []

    url = f"{PINATA_BASE_URL}/data/pinList?status=pinned&pageLimit=100"
    resp = requests.get(url, headers=_headers(), timeout=15)
    resp.raise_for_status()

    rows = resp.json().get("rows", [])
    return [
        {
            "ipfs_hash": r["ipfs_pin_hash"],
            "ipfs_url": f"https://gateway.pinata.cloud/ipfs/{r['ipfs_pin_hash']}",
            "size": r.get("size", 0),
            "date_pinned": r.get("date_pinned"),
            "metadata": r.get("metadata", {}),
        }
        for r in rows
    ]
