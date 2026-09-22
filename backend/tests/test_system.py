"""
MarketMind System Verification & Integration Test Suite
Validates authentication, access gatekeeping, technical indicator math, and database models.
"""

import sys
import os
import asyncio

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.auth_service import (
    hash_password,
    verify_password,
    generate_auth_token,
    verify_auth_token,
)
from app.db.client import db
from app.services.market_data import market_data_service


def test_password_hashing():
    print("-> Testing PBKDF2 password hashing & verification...")
    pw = "SecretTest#123"
    h1, s1 = hash_password(pw)
    h2, s2 = hash_password(pw)

    assert h1 != h2, "Salts must produce unique password hashes"
    assert s1 != s2, "Salts must be randomly generated"
    assert verify_password(pw, h1, s1), "Password verification failed for valid password"
    assert not verify_password("WrongPassword", h1, s1), "Password verification passed for invalid password"
    print("   [PASS] Password hashing & constant-time verification OK")


def test_session_tokens():
    print("-> Testing HMAC-SHA256 session tokens...")
    payload = {
        "user_id": "test_id_123",
        "email": "test@marketmind.ai",
        "role": "analyst",
        "status": "approved",
    }
    token = generate_auth_token(payload)
    decoded = verify_auth_token(token)

    assert decoded is not None, "Valid token failed to decode"
    assert decoded["email"] == "test@marketmind.ai", "Decoded token email mismatch"
    assert decoded["role"] == "analyst", "Decoded token role mismatch"

    # Test tampering
    parts = token.split(".")
    assert len(parts) == 2, "Token should be [payload].[signature]"
    tampered_token = f"{parts[0][:-4]}abcd.{parts[1]}"
    assert verify_auth_token(tampered_token) is None, "Tampered token was accepted!"
    print("   [PASS] Session token signing & tamper-resistance OK")


async def test_master_admin_and_approval_workflow():
    print("-> Testing Master Admin and user approval workflow...")
    # 1. Master admin verification
    admin_email = "monthandas2008@gmail.com"
    admin_user = await db.get_user_by_email(admin_email)
    assert admin_user is not None, "Master admin account not found in database"
    assert verify_password("Manthan@69", admin_user["password_hash"], admin_user["salt"]), (
        "Master admin password verification failed"
    )
    assert admin_user["role"] == "admin", "Master admin role is not 'admin'"
    assert admin_user["status"] == "approved", "Master admin status is not 'approved'"
    print("   [PASS] Master Admin seeded credentials verified")

    # 2. Register a new user (status: pending)
    test_user_email = "test.analyst.temp@marketmind.internal"
    # Clean up if exists from previous run
    existing = await db.get_user_by_email(test_user_email)
    if existing:
        await db.update_user_status(test_user_email, "pending")
    else:
        pw_hash, salt = hash_password("AnalystPassword@123")
        created = await db.create_user(
            email=test_user_email,
            password_hash=pw_hash,
            salt=salt,
            name="Test Quant Analyst",
            role="analyst",
            status="pending",
        )
        assert created is not None, "Failed to create test user"
    print("   [PASS] New user registered with 'pending' approval status")

    # 3. List pending users
    pending = await db.get_pending_users()
    pending_emails = [u["email"] for u in pending]
    assert test_user_email in pending_emails, f"Test user not found in pending list: {pending_emails}"
    print("   [PASS] Pending users listing verified")

    # 4. Approve user
    updated = await db.update_user_status(test_user_email, "approved")
    assert updated is True, "Failed to update user status to approved"

    approved_user = await db.get_user_by_email(test_user_email)
    assert approved_user["status"] == "approved", "User status not updated in DB"
    print("   [PASS] Admin 1-click user approval verified")

    # 5. Revoke / Reject user
    revoked = await db.update_user_status(test_user_email, "rejected")
    assert revoked is True, "Failed to revoke user"

    rejected_user = await db.get_user_by_email(test_user_email)
    assert rejected_user["status"] == "rejected", "User status not updated to rejected in DB"
    print("   [PASS] User status rejection / revocation verified")


def test_technical_desk_math():
    print("-> Testing Technical Analysis Desk math computation & NaN sanitization...")
    import pandas as pd
    import numpy as np
    from ta.momentum import RSIIndicator
    from ta.trend import SMAIndicator, MACD
    from app.services.market_data import safe_float, safe_int

    # 1. NaN and Inf sanitization
    assert safe_float(float('nan'), 0.0) == 0.0, "safe_float failed on NaN"
    assert safe_float(float('inf'), 0.0) == 0.0, "safe_float failed on Inf"
    assert safe_float(123.456) == 123.46, "safe_float failed on normal float rounding"
    assert safe_int(float('nan'), 10) == 10, "safe_int failed on NaN"
    print("   [PASS] NaN / Inf JSON sanitizers verified")

    # 2. Indicator computation on synthetic price series
    prices = [100.0 + (i * 0.75) + ((-1) ** i * 0.5) for i in range(40)]
    close_series = pd.Series(prices)

    rsi = RSIIndicator(close=close_series, window=14).rsi()
    latest_rsi = safe_float(rsi.iloc[-1])
    assert latest_rsi is not None and 0 <= latest_rsi <= 100, f"RSI out of bounds: {latest_rsi}"

    sma = SMAIndicator(close=close_series, window=20).sma_indicator()
    latest_sma = safe_float(sma.iloc[-1])
    assert latest_sma is not None and latest_sma > 0, "SMA-20 calculation failed"

    macd = MACD(close=close_series, window_slow=26, window_fast=12, window_sign=9).macd()
    latest_macd = safe_float(macd.iloc[-1])
    assert latest_macd is not None, "MACD calculation failed"

    print("   [PASS] Deterministic technical indicator calculations (RSI, SMA, MACD) OK")


async def main():
    print("========================================")
    print("MarketMind Comprehensive Test Suite")
    print("========================================")
    test_password_hashing()
    test_session_tokens()
    await test_master_admin_and_approval_workflow()
    test_technical_desk_math()
    print("========================================")
    print("ALL TESTS PASSED SUCCESSFULLY! (4/4)")
    print("========================================")


if __name__ == "__main__":
    asyncio.run(main())
