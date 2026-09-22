"""
Authentication & Access Control API routes for MarketMind.
Enforces Master Admin access and admin approval workflow for all new registrations.
"""

import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, EmailStr

from app.db.client import db
from app.services.auth_service import (
    hash_password,
    verify_password,
    generate_auth_token,
    verify_auth_token,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication & Access Control"])

ADMIN_EMAIL = "monthandas2008@gmail.com"


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str


class ApproveUserRequest(BaseModel):
    email: str
    action: str = "approve"  # "approve" or "reject"


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Dependency to extract and verify authenticated user from Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required.")
    token = authorization.split(" ")[1]
    payload = verify_auth_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired session token.")
    return payload


async def require_admin(authorization: Optional[str] = Header(None)) -> dict:
    """Dependency strictly restricting endpoints to monthandas2008@gmail.com."""
    user = await get_current_user(authorization)
    if user.get("role") != "admin" and user.get("email") != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Administrator privileges required.")
    return user


@router.post("/login")
async def login(req: LoginRequest):
    """
    Authenticates a user against secure PBKDF2-HMAC-SHA256 credentials.
    Rejects users whose account is still pending admin approval.
    """
    clean_email = req.email.strip().lower()
    if not clean_email or not req.password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    user = await db.get_user_by_email(clean_email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Verify password hash
    if not verify_password(req.password, user["password_hash"], user["salt"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Check approval status
    user_status = user.get("status", "pending")
    if user_status == "pending":
        raise HTTPException(
            status_code=403,
            detail=(
                f"Your account is pending administrator approval by {ADMIN_EMAIL}. "
                "Access will be unlocked once approved."
            ),
        )
    elif user_status == "rejected":
        raise HTTPException(
            status_code=403,
            detail=f"Access denied: Your account request was declined by {ADMIN_EMAIL}.",
        )

    # Issue signed session token
    user_role = user.get("role", "analyst")
    token_payload = {
        "user_id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user_role,
        "status": user_status,
    }
    token = generate_auth_token(token_payload)

    return {
        "status": "success",
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user_role,
            "status": user_status,
        },
    }


@router.post("/register")
async def register(req: RegisterRequest):
    """
    Registers a new account.
    All accounts (except master admin) receive 'status: pending' requiring admin approval.
    """
    clean_email = req.email.strip().lower()
    clean_name = req.name.strip()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="A valid email address is required.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    if not clean_name:
        raise HTTPException(status_code=400, detail="Name is required.")

    # Check existing user
    existing = await db.get_user_by_email(clean_email)
    if existing:
        raise HTTPException(status_code=400, detail="This email is already registered.")

    # Master admin email is automatically approved
    is_master_admin = clean_email == ADMIN_EMAIL
    role = "admin" if is_master_admin else "analyst"
    status = "approved" if is_master_admin else "pending"

    pw_hash, salt = hash_password(req.password)
    new_user = await db.create_user(
        email=clean_email,
        password_hash=pw_hash,
        salt=salt,
        name=clean_name,
        role=role,
        status=status,
    )

    if not new_user:
        raise HTTPException(status_code=500, detail="Failed to initialize user account.")

    if is_master_admin:
        token = generate_auth_token({
            "user_id": new_user["id"],
            "email": clean_email,
            "name": clean_name,
            "role": "admin",
            "status": "approved",
        })
        return {
            "status": "success",
            "message": "Master Admin account registered and verified.",
            "token": token,
            "user": {
                "id": new_user["id"],
                "email": clean_email,
                "name": clean_name,
                "role": "admin",
                "status": "approved",
            },
        }

    return {
        "status": "pending_approval",
        "message": (
            f"Registration submitted successfully. Your account is pending administrator approval "
            f"by {ADMIN_EMAIL}. You will be able to log in once approved."
        ),
        "user": {
            "email": clean_email,
            "name": clean_name,
            "status": "pending",
        },
    }


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Returns the verified profile of the active session token."""
    return user


@router.get("/pending-users")
async def list_pending_users(admin: dict = Depends(require_admin)):
    """
    Administrator endpoint: Returns all accounts awaiting access approval.
    Accessible only by monthandas2008@gmail.com.
    """
    pending = await db.get_pending_users()
    return {
        "count": len(pending),
        "users": pending,
    }


@router.get("/users")
async def list_all_users(admin: dict = Depends(require_admin)):
    """
    Administrator endpoint: Returns all registered accounts.
    Accessible only by monthandas2008@gmail.com.
    """
    users = await db.get_all_users()
    return {
        "count": len(users),
        "users": users,
    }


@router.post("/approve-user")
async def approve_or_reject_user(req: ApproveUserRequest, admin: dict = Depends(require_admin)):
    """
    Administrator endpoint: Approves or rejects a user registration.
    Accessible only by monthandas2008@gmail.com.
    """
    clean_email = req.email.strip().lower()
    target_user = await db.get_user_by_email(clean_email)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    new_status = "approved" if req.action.lower() == "approve" else "rejected"
    success = await db.update_user_status(clean_email, new_status)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update user status.")

    logger.info(f"User {clean_email} status updated to {new_status} by admin {admin.get('email')}")
    return {
        "status": "success",
        "email": clean_email,
        "new_status": new_status,
        "message": f"User {clean_email} has been successfully {new_status}.",
    }
