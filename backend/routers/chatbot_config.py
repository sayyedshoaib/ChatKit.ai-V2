# app/api/v1/chatbot_config.py
from fastapi import APIRouter, HTTPException, UploadFile, File
from core.db import db
from models.chatbot_config import ChatbotConfig
from uuid import uuid4
import os
from dotenv import load_dotenv
load_dotenv()

CHATBOT_CONFIG_COL = os.getenv("CHATBOT_CONFIG_COL")

router = APIRouter()
chatbot_collection = db[CHATBOT_CONFIG_COL]

@router.post("/", response_model=dict)
async def create_or_update_config(config: ChatbotConfig):
    config_dict = {
        "id": str(uuid4()),
        "tenant_id": config.tenant_id,
        "welcome_message": config.welcome_message,
        "faqs": config.faqs,
        "workflows": config.workflows,
        "rag_sources": config.rag_sources,
        "db_connection": config.db_connection
    }

    existing = await chatbot_collection.find_one({"tenant_id": config.tenant_id})
    print(f"got this: {existing}")
    if existing:
        await chatbot_collection.update_one({"tenant_id": config.tenant_id}, {"$set": config_dict})
    else:
        await chatbot_collection.insert_one(config_dict)

    updated = await chatbot_collection.find_one({"tenant_id": config.tenant_id})
    if updated and "_id" in updated:
        updated.pop("_id")
    return updated



@router.get("/{tenant_id}", response_model=dict)
async def get_config(tenant_id: str):
    """
    Fetch chatbot configuration for a tenant.
    """
    config = await chatbot_collection.find_one({"tenant_id": tenant_id})
    if config:
        return config
    raise HTTPException(status_code=404, detail="Chatbot config not found")

@router.post("/{tenant_id}/upload_rag_source")
async def upload_rag_source(tenant_id: str, file: UploadFile = File(...)):
    """
    Upload a document for RAG agent.
    For now, just store metadata in chatbot config.
    Later, you’ll add embedding logic (FAISS or MongoDB Vector Search).
    """
    config = await chatbot_collection.find_one({"tenant_id": tenant_id})
    if not config:
        raise HTTPException(status_code=404, detail="Chatbot config not found")

    rag_source = {
        "source_id": str(uuid4()),
        "type": "pdf",  # could detect based on file.content_type
        "path_or_url": file.filename,
        "metadata": {"size": file.size if hasattr(file, "size") else None}
    }

    # Append to rag_sources
    config.setdefault("rag_sources", [])
    config["rag_sources"].append(rag_source)

    await chatbot_collection.update_one(
        {"tenant_id": tenant_id},
        {"$set": {"rag_sources": config["rag_sources"]}}
    )

    return {"message": "RAG source uploaded", "source": rag_source}
