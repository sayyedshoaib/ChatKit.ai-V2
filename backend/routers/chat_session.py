# app/api/v1/chat_sessions.py
import os
from fastapi import APIRouter, HTTPException
from uuid import uuid4
from core.db import db
from models.chat_session import StartChatRequest ,ChatMessage
from dotenv import load_dotenv
load_dotenv()

CHAT_SESSION_COL = os.getenv("CHAT_SESSION_COL")
CHATBOT_CONFIG_COL = os.getenv("CHATBOT_CONFIG_COL")

router = APIRouter()

chat_sessions_collection = db[CHAT_SESSION_COL]
chatbot_collection = db[CHATBOT_CONFIG_COL]


@router.post("/start", response_model=dict)
async def start_chat(req: StartChatRequest):
    config = await chatbot_collection.find_one({"tenant_id": req.tenant_id})
    if not config:
        raise HTTPException(status_code=404, detail="Chatbot config not found")

    chat_id = str(uuid4())
    session = {
        "chat_id": chat_id,
        "tenant_id": req.tenant_id,
        "user_info": req.user_info,
        "messages": []
    }
    await chat_sessions_collection.insert_one(session)

    return {
        "chat_id": chat_id,
        "welcome_message": config.get("welcome_message"),
        "faqs": config.get("faqs", [])
    }

@router.post("/{chat_id}/message", response_model=dict)
async def send_message(chat_id: str, message: ChatMessage):
    session = await chat_sessions_collection.find_one({"chat_id": chat_id})
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    # Append user message
    await chat_sessions_collection.update_one(
        {"chat_id": chat_id},
        {"$push": {"messages": message.dict()}}
    )

    # TODO: FAQ check, RAG agent, NL→SQL agent
    reply = {"sender": "bot", "text": "This is a placeholder response."}

    await chat_sessions_collection.update_one(
        {"chat_id": chat_id},
        {"$push": {"messages": reply}}
    )

    return reply

@router.get("/{chat_id}", response_model=dict)
async def get_chat(chat_id: str):
    session = await chat_sessions_collection.find_one({"chat_id": chat_id})
    if session:
        session.pop("_id", None)
        return session
    raise HTTPException(status_code=404, detail="Chat session not found")


# Next Step: Integrate Agents into Chat Sessions
# FAQ Matching

# When a user selects or types a question that matches a configured FAQ, return the tenant’s pre‑set answer directly.

# This avoids unnecessary LLM calls and ensures consistent responses.

# RAG Agent

# If the question isn’t in FAQs, check tenant’s uploaded documents (PDFs, docs, links).

# Use FAISS (per‑tenant folder) or MongoDB Vector Search to retrieve relevant chunks.

# Pass those chunks into the LLM for a contextual answer.

# NL→SQL Agent

# If tenant has configured a DB connection, translate user question → SQL → run query → return result → convert back to natural language.

# Example: “What’s my current balance?” → SQL query → return formatted answer.

# Fallback

# If neither FAQ nor RAG nor NL→SQL applies, return a safe fallback like:
# “Sorry, I don’t have information on that. Please try asking something else.”

# 🔹 After Agents
# Once agents are integrated, you’ll want:

# Analytics Router → track session stats (FAQ usage, agent usage, escalation counts).

# Escalation Router → handle workflows (send email, call API when escalation triggers).

# Admin Dashboard APIs → let tenants view analytics, manage configs, and monitor sessions.

# 🔹 Recommended Next Router
# 👉 The immediate next router should be agent integration inside chat_sessions:

# Extend /chat/{chat_id}/message to:

# Check FAQ.

# Call RAG agent (FAISS).

# Call NL→SQL agent if configured.

# Return fallback if unrelated.