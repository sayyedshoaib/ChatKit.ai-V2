# # app/api/v1/chat_sessions.py
# import os
# from fastapi import APIRouter, HTTPException, Depends
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# import jwt
# from uuid import uuid4
# from core.db import db
# from models.chat_session import StartChatRequest, ChatMessage
# from langchain_google_genai import ChatGoogleGenerativeAI
# from .utils.agents import run_orchestrator
# from dotenv import load_dotenv

# load_dotenv()

# CHAT_SESSION_COLLECTION = os.getenv("CHAT_SESSION_COLLECTION")
# CHATBOT_CONFIG_COLLECTION = os.getenv("CHATBOT_CONFIG_COLLECTION")
# os.environ["GEMINI_API_KEY"] = os.getenv("GEMINI_API_KEY")
# os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY")

# llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")

# router = APIRouter()

# chat_sessions_collection = db[CHAT_SESSION_COLLECTION]
# chatbot_collection = db[CHATBOT_CONFIG_COLLECTION]

# # --- Widget token verification (end users only) ---
# security = HTTPBearer()
# WIDGET_SECRET = os.getenv("WIDGET_SECRET", "widgetsecret")  # backend secret for widget tokens
# WIDGET_ALGO = "HS256"

# def get_end_user(token: HTTPAuthorizationCredentials = Depends(security)):
#     try:
#         payload = jwt.decode(token.credentials, WIDGET_SECRET, algorithms=[WIDGET_ALGO])
#         if payload.get("role") != "end_user":
#             raise HTTPException(status_code=403, detail="Only end users can access chat sessions")
#         if not payload.get("tenant_id") or not payload.get("user_id"):
#             raise HTTPException(status_code=400, detail="Invalid token payload")
#         return payload
#     except jwt.ExpiredSignatureError:
#         raise HTTPException(status_code=401, detail="Widget token expired")
#     except jwt.InvalidTokenError:
#         raise HTTPException(status_code=401, detail="Invalid widget token")

# # --- Routes ---

# @router.post("/start", response_model=dict)
# async def start_chat(req: StartChatRequest, user=Depends(get_end_user)):
#     # Ensure token tenant matches request tenant
#     if user.get("tenant_id") != req.tenant_id:
#         raise HTTPException(status_code=403, detail="Token tenant mismatch")

#     config = await chatbot_collection.find_one({"tenant_id": req.tenant_id})
#     if not config:
#         raise HTTPException(status_code=404, detail="Chatbot config not found")

#     chat_id = str(uuid4())
#     session = {
#         "chat_id": chat_id,
#         "tenant_id": req.tenant_id,
#         "user_id": user.get("user_id"),   # enforce per-user isolation
#         "user_info": req.user_info,
#         "messages": []
#     }
#     await chat_sessions_collection.insert_one(session)

#     return {
#         "chat_id": chat_id,
#         "welcome_message": config.get("welcome_message"),
#         "faqs": config.get("faqs", [])
#     }

# @router.get("/{chat_id}", response_model=dict)
# async def get_chat(chat_id: str, user=Depends(get_end_user)):
#     # session = await chat_sessions_collection.find_one({"chat_id": chat_id})
#     # if not session:
#     #     raise HTTPException(status_code=404, detail="Chat session not found")

#     session = await chat_sessions_collection.find_one({
#         "chat_id": chat_id,
#         "tenant_id": user["tenant_id"],
#         "user_id": user["user_id"],
#     })

#     if not session:
#         raise HTTPException(
#             status_code=404,
#             detail="Chat session not found",
#         )

#     if user.get("tenant_id") != session["tenant_id"] or user.get("user_id") != session["user_id"]:
#         raise HTTPException(status_code=403, detail="Token mismatch")

#     session.pop("_id", None)
#     return session

# @router.post("/{chat_id}/message", response_model=dict)
# async def send_message(chat_id: str, message: ChatMessage, user=Depends(get_end_user)):
#     # session = await chat_sessions_collection.find_one({"chat_id": chat_id})
#     # if not session:
#     #     raise HTTPException(status_code=404, detail="Chat session not found")

#     session = await chat_sessions_collection.find_one({
#         "chat_id": chat_id,
#         "tenant_id": user["tenant_id"],
#         "user_id": user["user_id"],
#     })

#     if not session:
#         raise HTTPException(
#             status_code=404,
#             detail="Chat session not found",
#         )

#     if user.get("tenant_id") != session["tenant_id"] or user.get("user_id") != session["user_id"]:
#         raise HTTPException(status_code=403, detail="Token mismatch")

#     try:
#         # Run orchestrator workflow for tenant
#         bot_text = await run_orchestrator(
#             tenant_id=session["tenant_id"],
#             user_query=message.text
#         )
#         bot_text = bot_text["text"]
#         # bot_text = "dummy response for testing"
#         print("LLM Response:", bot_text)
#     except Exception as e:
#         bot_text = f"Sorry, I couldn't process that. Error: {str(e)}"

#     # reply = {"sender": "bot", "text": bot_text}

#     # # Append user + bot messages to session
#     # await chat_sessions_collection.update_one(
#     #     {"chat_id": chat_id},
#     #     {"$push": {"messages": message.dict()}}
#     # )
#     # await chat_sessions_collection.update_one(
#     #     {"chat_id": chat_id},
#     #     {"$push": {"messages": reply}}
#     # )

#     # return reply

#     user_message = {
#         "sender": "user",
#         "text": message.text,
#     }

#     reply = {
#         "sender": "bot",
#         "text": bot_text,
#     }

#     await chat_sessions_collection.update_one(
#         {
#             "chat_id": chat_id,
#             "tenant_id": user["tenant_id"],
#             "user_id": user["user_id"],
#         },
#         {
#             "$push": {
#                 "messages": {
#                     "$each": [user_message, reply]
#                 }
#             }
#         },
#     )

#     return reply







# app/api/v1/chat_sessions.py

import datetime
import logging
import os
from uuid import uuid4

import jwt
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.db import db
from models.chat_session import StartChatRequest, ChatMessage
from .utils.agents import run_orchestrator


load_dotenv()

logger = logging.getLogger(__name__)

# --------------------------------------------------
# Configuration
# --------------------------------------------------

CHAT_SESSION_COLLECTION = os.getenv("CHAT_SESSION_COLLECTION")
CHATBOT_CONFIG_COLLECTION = os.getenv("CHATBOT_CONFIG_COLLECTION")

WIDGET_SECRET = os.getenv("WIDGET_SECRET")
WIDGET_ALGO = "HS256"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not WIDGET_SECRET:
    raise RuntimeError("WIDGET_SECRET is not configured")

if not CHAT_SESSION_COLLECTION:
    raise RuntimeError("CHAT_SESSION_COLLECTION is not configured")

if not CHATBOT_CONFIG_COLLECTION:
    raise RuntimeError("CHATBOT_CONFIG_COLLECTION is not configured")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not configured")

# Keep both environment names available for integrations that use them.
os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY
os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY

router = APIRouter()

chat_sessions_collection = db[CHAT_SESSION_COLLECTION]
chatbot_collection = db[CHATBOT_CONFIG_COLLECTION]

security = HTTPBearer()


# --------------------------------------------------
# Widget JWT authentication
# --------------------------------------------------

def get_end_user(
    token: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        payload = jwt.decode(
            token.credentials,
            WIDGET_SECRET,
            algorithms=[WIDGET_ALGO],
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Widget token expired. Please refresh the chat.",
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid widget token",
        )

    if payload.get("role") != "end_user":
        raise HTTPException(
            status_code=403,
            detail="Only end users can access chat sessions",
        )

    tenant_id = payload.get("tenant_id")
    user_id = payload.get("user_id")

    if (
        not isinstance(tenant_id, str)
        or not tenant_id.strip()
        or not isinstance(user_id, str)
        or not user_id.strip()
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid widget token payload",
        )

    return payload


# --------------------------------------------------
# Start a chat session
# --------------------------------------------------

@router.post("/start", response_model=dict)
async def start_chat(
    req: StartChatRequest,
    user=Depends(get_end_user),
):
    # A widget token can only start chats for its own tenant.
    if user["tenant_id"] != req.tenant_id:
        raise HTTPException(
            status_code=403,
            detail="Token tenant mismatch",
        )

    config = await chatbot_collection.find_one(
        {"tenant_id": user["tenant_id"]}
    )

    if not config:
        raise HTTPException(
            status_code=404,
            detail="Chatbot config not found",
        )

    chat_id = str(uuid4())

    session = {
        "chat_id": chat_id,
        "tenant_id": user["tenant_id"],
        "user_id": user["user_id"],
        "user_info": req.user_info,
        "messages": [],
        "created_at": datetime.datetime.now(
            datetime.timezone.utc
        ),
    }

    await chat_sessions_collection.insert_one(session)

    return {
        "chat_id": chat_id,
        "welcome_message": config.get("welcome_message"),
        "faqs": config.get("faqs", []),
    }


# --------------------------------------------------
# Retrieve a chat session
# --------------------------------------------------

@router.get("/{chat_id}", response_model=dict)
async def get_chat(
    chat_id: str,
    user=Depends(get_end_user),
):
    # Scope the database lookup to both tenant and visitor.
    session = await chat_sessions_collection.find_one(
        {
            "chat_id": chat_id,
            "tenant_id": user["tenant_id"],
            "user_id": user["user_id"],
        }
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Chat session not found",
        )

    # Never expose MongoDB's internal document ID.
    session.pop("_id", None)

    return session


# --------------------------------------------------
# Send a message
# --------------------------------------------------

@router.post("/{chat_id}/message", response_model=dict)
async def send_message(
    chat_id: str,
    message: ChatMessage,
    user=Depends(get_end_user),
):
    # Visitors may only send messages to their own sessions.
    session_filter = {
        "chat_id": chat_id,
        "tenant_id": user["tenant_id"],
        "user_id": user["user_id"],
    }

    session = await chat_sessions_collection.find_one(
        session_filter
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Chat session not found",
        )

    user_text = message.text.strip()

    if not user_text:
        raise HTTPException(
            status_code=422,
            detail="Message cannot be empty",
        )

    # Run the tenant-specific chatbot workflow.
    try:
        result = await run_orchestrator(
            tenant_id=session["tenant_id"],
            user_query=user_text,
        )

        if not isinstance(result, dict):
            raise ValueError("Unexpected orchestrator response")

        bot_text = result.get("text")

        if not isinstance(bot_text, str) or not bot_text.strip():
            raise ValueError("Orchestrator returned an empty response")

        bot_text = bot_text.strip()

    except Exception:
        # Log details on the server, not in the public widget.
        logger.exception(
            "Chat orchestrator failed for tenant_id=%s, chat_id=%s",
            session["tenant_id"],
            chat_id,
        )

        raise HTTPException(
            status_code=502,
            detail="Sorry, I couldn't process your message. Please try again.",
        )

    user_message = {
        "sender": "user",
        "text": user_text,
    }

    bot_message = {
        "sender": "bot",
        "text": bot_text,
    }

    # Store both messages atomically, scoped to the same visitor.
    update_result = await chat_sessions_collection.update_one(
        session_filter,
        {
            "$push": {
                "messages": {
                    "$each": [user_message, bot_message],
                }
            }
        },
    )

    if update_result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Chat session not found",
        )

    return bot_message






# step 1 : user click the chatbot button , start_chat api hit 
# step 2 : user type a msg ans press send button send_message is hit
# step 3 : in send_message we will use langgraph workflow agents ,we will analyze user question 
# in langchain workflow , we build agents as list 
# this list will be empty 
# then we wll append faq agent(its a compusory field in chatbot config)
# then we iterate over chatbot_config.agents and add agents repectively to agent 
# then when we have the list of agents , then we build the langchain workflow based on the list,
# once the workflow(agentic architecture) then we will provide the user query/message to the graph and then wait for the reponse if the langchain gav the proper reponse we will return the reponse , if it give something like cant find answer or any  keyword then there comes another condition
# if the escalation decsription logic(email , phone , or any api where the hit the ticket request) givenm by the tenant  we will use the esacalation logic
# if not then we return the repone , cant find answer or something like that.
# as of now lets not include esalation code (it could be future scope)
# now we have step 1 and step 2 code , lets implement step 3 ,
# update send message api 
# lets start with just a simple chat reponse from llm , no langchain no agents



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