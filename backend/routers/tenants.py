# app/api/v1/tenants.py

import datetime
import hashlib
import os
import secrets
from uuid import uuid4

import jwt
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from pydantic import BaseModel, Field

from core.db import tenants_collection, tenant_helper
from models.tenant import TenantSignup, TenantLogin


load_dotenv()

router = APIRouter()

# --------------------------------------------------
# Authentication configuration
# --------------------------------------------------

security = HTTPBearer()

JWT_SECRET = os.getenv("TENANT_JWT_SECRET")
WIDGET_SECRET = os.getenv("WIDGET_SECRET")

if not JWT_SECRET:
    raise RuntimeError("TENANT_JWT_SECRET is not configured")

if not WIDGET_SECRET:
    raise RuntimeError("WIDGET_SECRET is not configured")

JWT_ALGO = "HS256"
WIDGET_ALGO = "HS256"

pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
)


# --------------------------------------------------
# Password and API key helpers
# --------------------------------------------------

def set_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def hash_api_key(api_key: str) -> str:
    return hashlib.sha256(api_key.encode("utf-8")).hexdigest()


def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        payload = jwt.decode(
            token.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGO],
        )

        if not payload.get("role") or not payload.get("tenant_id"):
            raise HTTPException(
                status_code=401,
                detail="Invalid tenant token payload",
            )

        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )


def require_role(role: str):
    def role_checker(user=Depends(get_current_user)):
        if user.get("role") != role:
            raise HTTPException(
                status_code=403,
                detail=f"{role} role required",
            )
        return user

    return role_checker


def get_safe_tenant_data(tenant: dict) -> dict:
    """
    Use the existing tenant helper, but explicitly remove private
    credentials before returning tenant data to the frontend.

    The widget_key is intentionally exposed because it is a public
    embed credential, not the private tenant API key.
    """
    data = tenant_helper(tenant)

    data.pop("hashed_password", None)
    data.pop("api_key_hash", None)
    data.pop("api_key", None)

    if tenant.get("widget_key"):
        data["widget_key"] = tenant["widget_key"]

    return data


# --------------------------------------------------
# Request models
# --------------------------------------------------

class WidgetTokenInput(BaseModel):
    tenant_id: str = Field(min_length=1)
    widget_key: str = Field(min_length=1)
    user_id: str = Field(min_length=1)


# --------------------------------------------------
# Tenant signup
# --------------------------------------------------

@router.post("/signup", response_model=dict)
async def signup_tenant(payload: TenantSignup):
    existing = await tenants_collection.find_one(
        {"email": payload.email}
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Tenant with this email already exists",
        )

    # Private tenant API key. Return it only once at signup.
    raw_api_key = secrets.token_hex(32)
    hashed_api_key = hash_api_key(raw_api_key)

    # Public key used by the embedded chatbot.
    widget_key = secrets.token_urlsafe(32)

    tenant_dict = {
        "id": str(uuid4()),
        "name": payload.name,
        "email": payload.email,
        "hashed_password": set_password(payload.password),
        "api_key_hash": hashed_api_key,
        "widget_key": widget_key,
    }

    result = await tenants_collection.insert_one(tenant_dict)

    created = await tenants_collection.find_one(
        {"_id": result.inserted_id}
    )

    if not created:
        raise HTTPException(
            status_code=500,
            detail="Tenant was created but could not be retrieved",
        )

    tenant_data = get_safe_tenant_data(created)

    # The private API key is returned only in this signup response.
    tenant_data["api_key"] = raw_api_key

    # Explicitly provide the public key for the embed snippet.
    tenant_data["widget_key"] = widget_key

    return tenant_data


# --------------------------------------------------
# Tenant login
# --------------------------------------------------

@router.post("/login", response_model=dict)
async def login_tenant(payload: TenantLogin):
    tenant = await tenants_collection.find_one(
        {"email": payload.email}
    )

    if not tenant:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not verify_password(
        payload.password,
        tenant["hashed_password"],
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    # Support tenants created before widget_key was introduced.
    widget_key = tenant.get("widget_key")

    if not widget_key:
        widget_key = secrets.token_urlsafe(32)

        await tenants_collection.update_one(
            {"id": tenant["id"]},
            {"$set": {"widget_key": widget_key}},
        )

        tenant["widget_key"] = widget_key

    token = jwt.encode(
        {
            "role": "tenant",
            "tenant_id": tenant["id"],
            "exp": (
                datetime.datetime.now(datetime.timezone.utc)
                + datetime.timedelta(hours=1)
            ),
        },
        JWT_SECRET,
        algorithm=JWT_ALGO,
    )

    tenant_data = get_safe_tenant_data(tenant)
    tenant_data["widget_key"] = widget_key

    return {
        "tenant": tenant_data,
        "access_token": token,
        "token_type": "Bearer",
    }


# --------------------------------------------------
# Regenerate private tenant API key
# --------------------------------------------------

@router.post("/regenerate_api_key", response_model=dict)
async def regenerate_api_key(
    tenant_id: str,
    user=Depends(get_current_user),
):
    if user.get("role") != "tenant":
        raise HTTPException(
            status_code=403,
            detail="Only tenants can regenerate their API key",
        )

    # A tenant may regenerate only their own key.
    if user.get("tenant_id") != tenant_id:
        raise HTTPException(
            status_code=403,
            detail="You cannot regenerate another tenant's API key",
        )

    tenant = await tenants_collection.find_one(
        {"id": tenant_id}
    )

    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Tenant not found",
        )

    raw_api_key = secrets.token_hex(32)
    hashed_api_key = hash_api_key(raw_api_key)

    # Store only the hash, not the raw private API key.
    await tenants_collection.update_one(
        {"id": tenant_id},
        {
            "$set": {
                "api_key_hash": hashed_api_key,
            },
            "$unset": {
                "api_key": "",
            },
        },
    )

    return {
        "message": "API key regenerated successfully",
        "new_api_key": raw_api_key,
    }


# --------------------------------------------------
# Create a short-lived widget JWT
# --------------------------------------------------

@router.post("/create_widget_token", response_model=dict)
async def create_widget_token(payload: WidgetTokenInput):
    tenant = await tenants_collection.find_one(
        {"id": payload.tenant_id}
    )

    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Tenant not found",
        )

    stored_widget_key = tenant.get("widget_key")

    if (
        not stored_widget_key
        or not secrets.compare_digest(
            stored_widget_key,
            payload.widget_key,
        )
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid widget key",
        )

    token = jwt.encode(
        {
            "role": "end_user",
            "tenant_id": payload.tenant_id,
            "user_id": payload.user_id,
            "exp": (
                datetime.datetime.now(datetime.timezone.utc)
                + datetime.timedelta(minutes=60)
            ),
        },
        WIDGET_SECRET,
        algorithm=WIDGET_ALGO,
    )

    return {"widget_token": token}
