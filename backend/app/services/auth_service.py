"""
Authentication & Cryptographic Security Service for MarketMind.
Provides secure password hashing (PBKDF2-HMAC-SHA256 with 100,000 iterations),
tamper-proof signed session tokens, and authentication helpers.
Zero external native library dependencies.
"""

import os
import hmac
import hashlib
import base64
import json
import secrets
import time
import logging
from typing import Optional, Tuple, Dict, Any

logger = logging.getLogger(__name__)

# Master signing secret derived from environment
AUTH_SECRET = os.getenv("SECRET_KEY", "marketmind_auth_master_secret_key_2026_production").encode("utf-8")
HASH_ITERATIONS = 100000


def hash_password(password: str) -> Tuple[str, str]:
    """
    Hashes a password using PBKDF2-HMAC-SHA256 with a cryptographically secure random salt.
    Returns: (hex_hash, hex_salt)
    """
    salt_bytes = secrets.token_bytes(16)
    hash_bytes = hashlib.pbkdf2_hmac(
        hash_name="sha256",
        password=password.encode("utf-8"),
        salt=salt_bytes,
        iterations=HASH_ITERATIONS,
        dklen=32,
    )
    return hash_bytes.hex(), salt_bytes.hex()


def verify_password(password: str, password_hash_hex: str, salt_hex: str) -> bool:
    """
    Verifies a plain password against the stored PBKDF2-HMAC-SHA256 hash using constant-time comparison.
    """
    try:
        salt_bytes = bytes.fromhex(salt_hex)
        expected_hash = bytes.fromhex(password_hash_hex)
        computed_hash = hashlib.pbkdf2_hmac(
            hash_name="sha256",
            password=password.encode("utf-8"),
            salt=salt_bytes,
            iterations=HASH_ITERATIONS,
            dklen=32,
        )
        return hmac.compare_digest(computed_hash, expected_hash)
    except Exception as e:
        logger.error(f"Error verifying password hash: {e}")
        return False


def generate_auth_token(payload: Dict[str, Any], expiry_seconds: int = 86400 * 30) -> str:
    """
    Generates a secure, tamper-proof signed session token using HMAC-SHA256.
    Token structure: [base64_encoded_payload].[hex_signature]
    Valid for 30 days by default.
    """
    token_data = dict(payload)
    token_data["exp"] = int(time.time()) + expiry_seconds
    raw_json = json.dumps(token_data, separators=(",", ":"), sort_keys=True).encode("utf-8")
    b64_payload = base64.urlsafe_b64encode(raw_json).decode("utf-8")

    signature = hmac.new(AUTH_SECRET, b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{b64_payload}.{signature}"


def verify_auth_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verifies token signature and checks expiry time.
    Returns the payload dictionary if valid, or None if invalid/expired/tampered.
    """
    if not token or "." not in token:
        return None
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        b64_payload, signature = parts[0], parts[1]

        # Verify HMAC signature in constant time
        expected_sig = hmac.new(AUTH_SECRET, b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected_sig):
            logger.warning("Auth token verification failed: signature mismatch.")
            return None

        # Decode payload
        raw_json = base64.urlsafe_b64decode(b64_payload.encode("utf-8")).decode("utf-8")
        payload = json.loads(raw_json)

        # Check expiration
        exp = payload.get("exp", 0)
        if time.time() > exp:
            logger.warning("Auth token expired.")
            return None

        return payload
    except Exception as e:
        logger.error(f"Error parsing auth token: {e}")
        return None
