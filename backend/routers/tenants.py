# app/api/v1/tenants.py
from fastapi import APIRouter, HTTPException, Depends
from uuid import uuid4
from core.db import tenants_collection, tenant_helper
from models.tenant import TenantSignup, TenantLogin
from pydantic import BaseModel
import secrets, jwt, os, datetime
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from dotenv import load_dotenv
import hashlib

# Load environment variables
load_dotenv()

router = APIRouter()

# --- Auth setup ---
security = HTTPBearer()
JWT_SECRET = os.getenv("TENANT_JWT_SECRET", "supersecret")   # single secret for tenant tokens
JWT_ALGO = "HS256"

# --- Password hashing (Argon2) ---
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def set_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)

def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(token.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(role: str):
    def role_checker(user=Depends(get_current_user)):
        if user.get("role") != role:
            raise HTTPException(status_code=403, detail=f"{role} role required")
        return user
    return role_checker

def hash_api_key(api_key: str) -> str:
    return hashlib.sha256(api_key.encode()).hexdigest()
# --- Routes ---



@router.post("/signup", response_model=dict)
async def signup_tenant(payload: TenantSignup):
    existing = await tenants_collection.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Tenant with this email already exists")

    # Generate raw API key + hash
    raw_key = secrets.token_hex(32)  # strong 64-char key
    hashed_key = hash_api_key(raw_key)

    # tenant_dict = {
    #     "id": str(uuid4()),
    #     "name": payload.name,
    #     "email": payload.email,
    #     "hashed_password": set_password(payload.password),
    #     "api_key_hash": hashed_key
    # }

    tenant_dict = {
        "id": str(uuid4()),
        "name": payload.name,
        "email": payload.email,
        "hashed_password": set_password(payload.password),

        "api_key": raw_key,
        "api_key_hash": hashed_key
    }


    result = await tenants_collection.insert_one(tenant_dict)
    created = await tenants_collection.find_one({"_id": result.inserted_id})

    # Return tenant info + raw API key (only once!)
    tenant_data = tenant_helper(created)
    tenant_data["api_key"] = raw_key
    return tenant_data

@router.post("/login", response_model=dict)
async def login_tenant(payload: TenantLogin):
    tenant = await tenants_collection.find_one({"email": payload.email})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    if not verify_password(payload.password, tenant["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = jwt.encode(
        {
            "role": "tenant",
            "tenant_id": tenant["id"],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        },
        JWT_SECRET,
        algorithm=JWT_ALGO
    )

    # return {
    #     "tenant": tenant_helper(tenant),
    #     "access_token": token,
    #     "token_type": "Bearer"
    # }
    tenant_data = tenant_helper(tenant)
    tenant_data["api_key"] = tenant.get("api_key")

    return {
        "tenant": tenant_data,
        "access_token": token,
        "token_type": "Bearer"
    }


@router.post("/regenerate_api_key", response_model=dict)
async def regenerate_api_key(tenant_id: str,user=Depends(get_current_user)):
    if user.get("role") not in ["tenant"]:
        raise HTTPException(status_code=403, detail="Not authorized to reset password")
    
    tenant = await tenants_collection.find_one({"id": tenant_id})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # Generate new API key
    raw_key = secrets.token_hex(32)
    hashed_key = hash_api_key(raw_key)


    # await tenants_collection.update_one(
    #     {"id": tenant_id},
    #     {"$set": {"api_key_hash": hashed_key}}
    # )

    await tenants_collection.update_one(
        {"id": tenant_id},
        {
            "$set": {
                "api_key": raw_key,
                "api_key_hash": hashed_key
            }
        }
    )
    return {"new_api_key": raw_key}

WIDGET_SECRET = os.getenv("WIDGET_SECRET", "widgetsecret")  # backend secret for widget tokens
WIDGET_ALGO = "HS256"

# @router.post("/create_widget_token", response_model=dict)
# async def create_widget_token(tenant_id: str, api_key: str, user_id: str):
#     tenant = await tenants_collection.find_one({"id": tenant_id})
#     if not tenant:
#         raise HTTPException(status_code=404, detail="Tenant not found")

#     # Validate API key (hash comparison)
#     if tenant["api_key_hash"] != hash_api_key(api_key):
#         raise HTTPException(status_code=401, detail="Invalid API key")

#     # Issue short-lived widget JWT
#     token = jwt.encode(
#         {
#             "role": "end_user",
#             "tenant_id": tenant_id,
#             "user_id": user_id,
#             "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
#         },
#         WIDGET_SECRET,
#         algorithm=WIDGET_ALGO
#     )

#     return {"widget_token": token}

from pydantic import BaseModel

class WidgetTokenInput(BaseModel):
    tenant_id: str
    api_key: str
    user_id: str


@router.post("/create_widget_token", response_model=dict)
async def create_widget_token(payload: WidgetTokenInput):

    tenant = await tenants_collection.find_one(
        {"id": payload.tenant_id}
    )

    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Tenant not found"
        )

    if tenant["api_key_hash"] != hash_api_key(payload.api_key):
        raise HTTPException(
            status_code=401,
            detail="Invalid API key"
        )

    token = jwt.encode(
        {
            "role": "end_user",
            "tenant_id": payload.tenant_id,
            "user_id": payload.user_id,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=60)
        },
        WIDGET_SECRET,
        algorithm=WIDGET_ALGO
    )

    return {"widget_token": token}

@router.get("/{tenant_id}", response_model=dict)
async def get_tenant(tenant_id: str,user=Depends(get_current_user)):

    if (
        user["role"] == "admin"
        or
        (
        user["role"] == "tenant"
        and
        user["tenant_id"] == tenant_id
        )
    ):

        tenant = await tenants_collection.find_one({"id": tenant_id})
        if tenant:
            return tenant_helper(tenant)
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    raise HTTPException(status_code=404, detail="Role not found")

class ResetPasswordInput(BaseModel):
    tenant_id: str
    new_password: str

@router.put("/reset_password", response_model=dict)
async def reset_password(payload: ResetPasswordInput, user=Depends(get_current_user)):
    if user.get("role") not in ["admin", "tenant"]:
        raise HTTPException(status_code=403, detail="Not authorized to reset password")

    hashed = set_password(payload.new_password)
    result = await tenants_collection.update_one(
        {"id": payload.tenant_id},
        {"$set": {"hashed_password": hashed}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")

    return {"message": "Password updated successfully"}






# 1. Chat Session Document
# Each chat session gets a unique chat_id (UUID). That document stores:

# Tenant details → which company owns this chatbot.

# Chatbot configuration → FAQs, workflows, escalation logic, branding.

# User info (optional) → only what’s needed for the conversation (e.g., name, email, order ID).

# Conversation state → messages, satisfaction checks, escalation status.

# Example (MongoDB document):

# json
# {
#   "chat_id": "123e4567-e89b-12d3-a456-426614174000",
#   "tenant_id": "tenant_abc",
#   "chatbot_config": {
#     "faqs": [
#       {"q": "What are your support hours?", "a": "9am-6pm IST"}
#     ],
#     "workflows": {...},
#     "live_agent": {"email": "support@client.com"}
#   },
#   "user_info": {
#     "user_id": "anon_123",
#     "email": "customer@example.com",
#     "metadata": {"order_id": "ORD-98765"}
#   },
#   "messages": [
#     {"sender": "user", "text": "What are your support hours?", "timestamp": "..."},
#     {"sender": "bot", "text": "Our support hours are 9am-6pm IST.", "timestamp": "..."}
#   ],
#   "escalated": false,
#   "feedback": null
# }
# 2. Why This Works
# No global user router → You don’t manage tenant customers directly.

# Tenant isolation → Each chat session belongs to one tenant.

# Compliance → User info is scoped to a chat_id, making it easier to enforce retention policies, PII masking, and GDPR/CCPA deletion.

# Flexibility → If a tenant wants to integrate their own DB, the chatbot agent can query it (via natural language → SQL/NoSQL) without storing sensitive data in your system.

# 3. Implementation Flow
# When a tenant configures their chatbot:

# They define FAQs, workflows, escalation methods.

# They decide what user info (if any) should be collected per chat.

# When a new chat starts:

# Generate a chat_id.

# Create a session document with tenant + chatbot config + user info.

# During conversation:

# Append messages to the session.

# Use RAG or DB queries for answers.

# Escalate if needed (email/API).

# Analytics:

# Aggregate per-tenant chat sessions for metrics (volume, satisfaction, escalation rate).

# ✅ So instead of a user router, you’ll want a chat session router that handles:

# POST /chat/start → create new chat session with chat_id.

# POST /chat/{chat_id}/message → add user message, get bot response.

# GET /chat/{chat_id} → fetch session details (tenant config + user info + history).

# GET /chat/analytics → tenant-level metrics.