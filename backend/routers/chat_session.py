# app/api/v1/chat_sessions.py

import datetime
import logging
import os
import time
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

os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY
os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY

router = APIRouter()

chat_sessions_collection = db[CHAT_SESSION_COLLECTION]
chatbot_collection = db[CHATBOT_CONFIG_COLLECTION]

security = HTTPBearer()


# --------------------------------------------------
# Common helpers
# --------------------------------------------------

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)


def normalize_analytics(
    analytics,
    elapsed_ms: float,
    *,
    default_status: str = "success",
) -> dict:
    """
    Normalize optional orchestrator analytics metadata.

    Never infer agent usage or FAQ matches from the response text.
    """
    if not isinstance(analytics, dict):
        analytics = {}

    status = analytics.get("status", default_status)

    if status not in {"success", "fallback", "error"}:
        status = default_status

    agent_names = analytics.get("agent_names", [])
    if not isinstance(agent_names, list):
        agent_names = []

    agent_names = [
        name.strip()
        for name in agent_names
        if isinstance(name, str) and name.strip()
    ]

    faq_matched = analytics.get("faq_matched")
    if not isinstance(faq_matched, bool):
        faq_matched = None

    rag_results_count = analytics.get("rag_results_count")
    if (
        not isinstance(rag_results_count, int)
        or isinstance(rag_results_count, bool)
        or rag_results_count < 0
    ):
        rag_results_count = None

    error_type = analytics.get("error_type")
    if not isinstance(error_type, str) or not error_type.strip():
        error_type = None

    reported_duration = analytics.get("response_time_ms")
    if isinstance(reported_duration, (int, float)) and not isinstance(
        reported_duration, bool
    ):
        response_time_ms = max(0.0, float(reported_duration))
    else:
        response_time_ms = max(0.0, elapsed_ms)

    return {
        "status": status,
        "response_time_ms": round(response_time_ms, 2),
        "agent_names": agent_names,
        "faq_matched": faq_matched,
        "rag_results_count": rag_results_count,
        "error_type": error_type,
    }


async def record_attempt(
    session_filter: dict,
    *,
    user_text: str,
    bot_text: str | None,
    analytics: dict,
):
    """
    Persist a message attempt and its analytics event in the existing
    chat-session document.

    Failed attempts keep the user's message and the event, even if no
    bot response was generated.
    """
    now = utc_now()

    event = {
        "event_id": str(uuid4()),
        "timestamp": now,
        "event_type": "message",
        **analytics,
    }

    messages = [
        {
            "sender": "user",
            "text": user_text,
        }
    ]

    if isinstance(bot_text, str) and bot_text.strip():
        messages.append(
            {
                "sender": "bot",
                "text": bot_text.strip(),
            }
        )

    result = await chat_sessions_collection.update_one(
        session_filter,
        {
            "$push": {
                "messages": {"$each": messages},
                "analytics_events": event,
            },
            "$set": {
                "last_activity_at": now,
            },
        },
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Chat session not found",
        )


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
    now = utc_now()

    session = {
        "chat_id": chat_id,
        "tenant_id": user["tenant_id"],
        "user_id": user["user_id"],
        "user_info": req.user_info,
        "messages": [],
        "analytics_events": [],
        "created_at": now,
        "last_activity_at": now,
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

    session.pop("_id", None)

    return session


# --------------------------------------------------
# Send a message and record analytics
# --------------------------------------------------

@router.post("/{chat_id}/message", response_model=dict)
async def send_message(
    chat_id: str,
    message: ChatMessage,
    user=Depends(get_end_user),
):
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

    started_at = time.perf_counter()

    try:
        result = await run_orchestrator(
            tenant_id=session["tenant_id"],
            user_query=user_text,
            session_id=chat_id,
        )

        elapsed_ms = (
            time.perf_counter() - started_at
        ) * 1000

        if not isinstance(result, dict):
            raise ValueError("Unexpected orchestrator response")

        bot_text = result.get("text")

        if not isinstance(bot_text, str) or not bot_text.strip():
            raise ValueError("Orchestrator returned an empty response")

        bot_text = bot_text.strip()

        analytics = normalize_analytics(
            result.get("analytics"),
            elapsed_ms,
        )

        await record_attempt(
            session_filter,
            user_text=user_text,
            bot_text=bot_text,
            analytics=analytics,
        )

        # Preserve the existing widget response contract.
        return {"text": bot_text}

    except HTTPException:
        raise

    except Exception as exc:
        elapsed_ms = (
            time.perf_counter() - started_at
        ) * 1000

        logger.exception(
            "Chat processing failed for tenant_id=%s, chat_id=%s",
            session["tenant_id"],
            chat_id,
        )

        analytics = normalize_analytics(
            {
                "status": "error",
                "error_type": type(exc).__name__,
            },
            elapsed_ms,
            default_status="error",
        )

        try:
            await record_attempt(
                session_filter,
                user_text=user_text,
                bot_text=None,
                analytics=analytics,
            )
        except HTTPException:
            raise
        except Exception:
            logger.exception(
                "Failed to persist error analytics for chat_id=%s",
                chat_id,
            )

        raise HTTPException(
            status_code=502,
            detail=(
                "Sorry, I couldn't process your message. "
                "Please try again."
            ),
        )