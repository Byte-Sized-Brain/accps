from web3 import Web3
from config import SEPOLIA_RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS, CONTRACT_ABI


class BlockchainClient:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(SEPOLIA_RPC_URL))
        self.account = None
        self.contract = None

        if PRIVATE_KEY:
            self.account = self.w3.eth.account.from_key(PRIVATE_KEY)

        if CONTRACT_ADDRESS and CONTRACT_ABI:
            self.contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(CONTRACT_ADDRESS),
                abi=CONTRACT_ABI,
            )

    @property
    def is_configured(self) -> bool:
        return self.contract is not None and self.account is not None

    def register_content(
        self, fingerprint: str, content_type: str, title: str, description: str
    ) -> str:
        """Register content on-chain. Returns transaction hash."""
        if not self.is_configured:
            raise RuntimeError("Blockchain client not configured. Set CONTRACT_ADDRESS, PRIVATE_KEY, and ABI.")

        nonce = self.w3.eth.get_transaction_count(self.account.address)

        tx = self.contract.functions.registerContent(
            fingerprint, content_type, title, description
        ).build_transaction({
            "from": self.account.address,
            "nonce": nonce,
            "gas": 300000,
            "gasPrice": self.w3.eth.gas_price,
            "chainId": 11155111,  # Sepolia chain ID
        })

        signed = self.w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
        raw = getattr(signed, "raw_transaction", None) or signed.rawTransaction
        tx_hash = self.w3.eth.send_raw_transaction(raw)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

        return receipt.transactionHash.hex()

    def check_exists(self, fingerprint: str) -> bool:
        """Check if a fingerprint is already registered on-chain."""
        if not self.is_configured:
            return False

        result = self.contract.functions.getRecord(fingerprint).call()
        return result[5]  # 'exists' field

    def get_record(self, fingerprint: str) -> dict | None:
        """Get a content record from the blockchain."""
        if not self.is_configured:
            return None

        result = self.contract.functions.getRecord(fingerprint).call()
        if not result[5]:  # exists
            return None

        return {
            "owner": result[0],
            "content_type": result[1],
            "title": result[2],
            "description": result[3],
            "timestamp": result[4],
            "exists": result[5],
        }

    def verify_ownership(self, fingerprint: str, claimed_owner: str) -> bool:
        """Verify if an address owns the content on-chain."""
        if not self.is_configured:
            return False

        return self.contract.functions.verifyOwnership(
            fingerprint, Web3.to_checksum_address(claimed_owner)
        ).call()

    def get_record_count(self) -> int:
        """Get total number of registered records."""
        if not self.is_configured:
            return 0
        return self.contract.functions.getRecordCount().call()
