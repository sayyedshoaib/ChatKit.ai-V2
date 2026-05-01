# app/api/v1/tenants.py
from fastapi import APIRouter, HTTPException, Depends
from uuid import uuid4
from core.db import tenants_collection, tenant_helper, set_password, verify_password
from models.tenant import Tenant , TenantLogin , TenantSignup
from pydantic import BaseModel
import secrets

router = APIRouter()


@router.post("/signup", response_model=dict)
async def signup_tenant(payload: TenantSignup):
    # Check if tenant already exists
    existing = await tenants_collection.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Tenant with this email already exists")

    tenant_dict = {
        "id": str(uuid4()),
        "name": payload.name,
        "email": payload.email,
        "hashed_password": set_password(payload.password),
        "api_key": secrets.token_hex(16)  # issue API key for widget usage
    }

    result = await tenants_collection.insert_one(tenant_dict)
    created = await tenants_collection.find_one({"_id": result.inserted_id})
    return tenant_helper(created)

@router.post("/login", response_model=dict)
async def login_tenant(payload: TenantLogin):
    tenant = await tenants_collection.find_one({"email": payload.email})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    if not verify_password(payload.password, tenant["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # For simplicity, return tenant info + api_key (in production issue JWT for dashboard)
    return tenant_helper(tenant)

@router.get("/{tenant_id}", response_model=dict)
async def get_tenant(tenant_id: str):
    tenant = await tenants_collection.find_one({"id": tenant_id})
    if tenant:
        return tenant_helper(tenant)
    raise HTTPException(status_code=404, detail="Tenant not found")




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