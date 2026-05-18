# app/api/v1/chatbot_config.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt, os
from uuid import uuid4
from core.db import db
from models.chatbot_config import ChatbotConfig
from pydantic import BaseModel
from typing import Dict
from dotenv import load_dotenv
import datetime

# Load env
load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY")

CHATBOT_CONFIG_COLLECTION = os.getenv("CHATBOT_CONFIG_COLLECTION")
EMBEDDINGS_COLLECTION = os.getenv("EMBEDDINGS_COLLECTION")
INDEX_NAME = os.getenv("INDEX_NAME")

chatbot_collection = db[CHATBOT_CONFIG_COLLECTION]
embeddings_collection = db[EMBEDDINGS_COLLECTION]

router = APIRouter()

# --- Auth setup ---
security = HTTPBearer()
JWT_SECRET = os.getenv("TENANT_JWT_SECRET", "supersecret")
JWT_ALGO = "HS256"

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

# --- Routes ---

@router.post("/", response_model=dict)
async def create_or_update_config(config: ChatbotConfig, user=Depends(require_role("tenant"))):
    if user.get("tenant_id") != config.tenant_id:
        raise HTTPException(status_code=403, detail="Tenant mismatch")

    config_dict = {
        "id": str(uuid4()),
        "tenant_id": config.tenant_id,
        "welcome_message": config.welcome_message,
        "faqs": config.faqs,
        "workflows": config.workflows,
        "rag_sources": config.rag_sources,
        "db_connection": config.db_connection,
        "description": config.description,
        "instruction": config.instruction,
        "agents": config.agents
    }

    existing = await chatbot_collection.find_one({"tenant_id": config.tenant_id})
    if existing:
        await chatbot_collection.update_one({"tenant_id": config.tenant_id}, {"$set": config_dict})
    else:
        await chatbot_collection.insert_one(config_dict)

    updated = await chatbot_collection.find_one({"tenant_id": config.tenant_id})
    if updated and "_id" in updated:
        updated.pop("_id")
    return updated

@router.get("/{tenant_id}", response_model=dict)
async def get_config(tenant_id: str, user=Depends(require_role("tenant"))):
    if user.get("tenant_id") != tenant_id:
        raise HTTPException(status_code=403, detail="Tenant mismatch")

    config = await chatbot_collection.find_one({"tenant_id": tenant_id})
    if config:
        config.pop("_id", None)
        return config
    raise HTTPException(status_code=404, detail="Chatbot config not found")

class AgentInput(BaseModel):
    tenant_id: str
    agent: dict

@router.post("/add_agent_to_config", response_model=dict)
async def add_agent_to_config(agent_input: AgentInput, user=Depends(require_role("tenant"))):
    if user.get("tenant_id") != agent_input.tenant_id:
        raise HTTPException(status_code=403, detail="Tenant mismatch")

    existing = await chatbot_collection.find_one({"tenant_id": agent_input.tenant_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Chatbot config not found")

    agents = list(existing.get("agents", []))
    agents.append(agent_input.agent)

    await chatbot_collection.update_one({"tenant_id": agent_input.tenant_id}, {"$set": {"agents": agents}})
    updated = await chatbot_collection.find_one({"tenant_id": agent_input.tenant_id})
    updated.pop("_id", None)
    return updated

class FAQInput(BaseModel):
    tenant_id: str
    faq: Dict[str, str]

@router.post("/add_faq_to_config", response_model=dict)
async def add_faq_to_config(faq_input: FAQInput, user=Depends(require_role("tenant"))):
    if user.get("tenant_id") != faq_input.tenant_id:
        raise HTTPException(status_code=403, detail="Tenant mismatch")

    existing = await chatbot_collection.find_one({"tenant_id": faq_input.tenant_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Chatbot config not found")

    faqs = list(existing.get("faqs", []))
    faqs.append(faq_input.faq)

    await chatbot_collection.update_one({"tenant_id": faq_input.tenant_id}, {"$set": {"faqs": faqs}})
    updated = await chatbot_collection.find_one({"tenant_id": faq_input.tenant_id})
    updated.pop("_id", None)
    return updated

class DBUrlInput(BaseModel):
    tenant_id: str
    db_url: str

@router.post("/add_db_url_to_config", response_model=dict)
async def add_db_url_to_config(db_input: DBUrlInput, user=Depends(require_role("tenant"))):
    if user.get("tenant_id") != db_input.tenant_id:
        raise HTTPException(status_code=403, detail="Tenant mismatch")

    existing = await chatbot_collection.find_one({"tenant_id": db_input.tenant_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Chatbot config not found")

    await chatbot_collection.update_one({"tenant_id": db_input.tenant_id}, {"$set": {"db_connection": db_input.db_url}})
    updated = await chatbot_collection.find_one({"tenant_id": db_input.tenant_id})
    updated.pop("_id", None)
    return updated




# {
#   "tenant_id": "146feabc-010f-4b81-8eaf-419eeddb7df2",
#   "welcome_message": "Hello! How can I help you today?",
#   "faqs": [],
#   "workflows": {},
#   "rag_sources": [],
#   "db_connection": "",
#   "description": "Tenant chatbot for customer support",
#   "instruction": "Answer FAQs and escalate complex queries",
#   "agents": []
# }
# {
#   "email": "tenant2@gmail.com",
#   "password": "Tenant@123"
# }
# {
#   "name": "Ajio",
#   "email": "tenant2@gmail.com",
#   "password": "Tenant@123"
# }
# --- Routes ---