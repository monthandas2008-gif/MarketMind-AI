"""
Key Manager Service for MarketMind.
Encrypts and decrypts user-supplied Gemini API keys at rest.
Ensures resilience across all environments with zero external binary dependencies.
"""

import os
import hmac
import hashlib
import base64
import secrets
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Master secret key derived from environment or fallback static seed
SECRET_SALT = os.getenv("SECRET_KEY", "marketmind-intel-production-salt-2026")


class UserKeyManager:
    """Manages encryption and secure storage of user-provided LLM API keys."""

    def __init__(self):
        self._master_secret = SECRET_SALT.encode("utf-8")

    def _derive_keystream(self, salt: bytes, length: int) -> bytes:
        """Derives a deterministic cryptographic keystream using PBKDF2 HMAC-SHA256."""
        return hashlib.pbkdf2_hmac(
            hash_name="sha256",
            password=self._master_secret,
            salt=salt,
            iterations=10000,
            dklen=length,
        )

    def encrypt_key(self, raw_key: str) -> str:
        """
        Encrypts an API key using authenticated keystream encryption.
        Returns a portable base64 bundle containing: [16-byte salt][ciphertext][32-byte HMAC tag]
        """
        if not raw_key:
            return ""
        data = raw_key.encode("utf-8")
        salt = secrets.token_bytes(16)
        keystream = self._derive_keystream(salt, len(data))
        ciphertext = bytes([b ^ k for b, k in zip(data, keystream)])
        tag = hmac.new(self._master_secret, salt + ciphertext, hashlib.sha256).digest()
        bundle = salt + ciphertext + tag
        return base64.urlsafe_b64encode(bundle).decode("utf-8")

    def decrypt_key(self, token: str) -> Optional[str]:
        """
        Decrypts an encrypted API key bundle, verifying HMAC integrity first.
        Returns the original API key or None if tampering / invalid format is detected.
        """
        if not token:
            return None
        try:
            bundle = base64.urlsafe_b64decode(token.encode("utf-8"))
            if len(bundle) < 48:  # 16 salt + at least 0 cipher + 32 tag
                return None
            salt = bundle[:16]
            tag = bundle[-32:]
            ciphertext = bundle[16:-32]

            # Verify integrity
            expected_tag = hmac.new(self._master_secret, salt + ciphertext, hashlib.sha256).digest()
            if not hmac.compare_digest(tag, expected_tag):
                logger.error("API Key decryption failed: HMAC integrity check mismatch.")
                return None

            keystream = self._derive_keystream(salt, len(ciphertext))
            plain_bytes = bytes([b ^ k for b, k in zip(ciphertext, keystream)])
            return plain_bytes.decode("utf-8")
        except Exception as e:
            logger.error(f"Failed to decrypt user API key: {e}")
            return None


key_manager = UserKeyManager()
