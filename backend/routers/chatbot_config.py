# # app/api/v1/chatbot_config.py
# from fastapi import APIRouter, HTTPException, Depends
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# import jwt, os
# from uuid import uuid4
# from core.db import db
# from models.chatbot_config import ChatbotConfig
# from pydantic import BaseModel
# from typing import Dict
# from dotenv import load_dotenv
# import datetime

# # Load env
# load_dotenv()
# os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY")

# CHATBOT_CONFIG_COLLECTION = os.getenv("CHATBOT_CONFIG_COLLECTION")
# EMBEDDINGS_COLLECTION = os.getenv("EMBEDDINGS_COLLECTION")
# INDEX_NAME = os.getenv("INDEX_NAME")

# chatbot_collection = db[CHATBOT_CONFIG_COLLECTION]
# embeddings_collection = db[EMBEDDINGS_COLLECTION]

# router = APIRouter()

# # --- Auth setup ---
# security = HTTPBearer()
# JWT_SECRET = os.getenv("TENANT_JWT_SECRET", "supersecret")
# JWT_ALGO = "HS256"

# def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
#     try:
#         payload = jwt.decode(token.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
#         return payload
#     except jwt.ExpiredSignatureError:
#         raise HTTPException(status_code=401, detail="Token expired")
#     except jwt.InvalidTokenError:
#         raise HTTPException(status_code=401, detail="Invalid token")

# def require_role(role: str):
#     def role_checker(user=Depends(get_current_user)):
#         if user.get("role") != role:
#             raise HTTPException(status_code=403, detail=f"{role} role required")
#         return user
#     return role_checker

# # --- Routes ---

# @router.post("/", response_model=dict)
# async def create_or_update_config(config: ChatbotConfig, user=Depends(require_role("tenant"))):
#     print(f"Received config for {config.tenant_id}: {config}")
#     if user.get("tenant_id") != config.tenant_id:
#         raise HTTPException(status_code=403, detail="Tenant mismatch")

#     config_dict = {
#         "id": str(uuid4()),
#         "tenant_id": config.tenant_id,
#         "welcome_message": config.welcome_message,
#         "faqs": config.faqs,
#         "workflows": config.workflows,
#         "rag_sources": config.rag_sources,
#         "db_connection": config.db_connection,
#         "description": config.description,
#         "instruction": config.instruction,
#         "agents": config.agents
#     }

#     existing = await chatbot_collection.find_one({"tenant_id": config.tenant_id})
#     if existing:
#         await chatbot_collection.update_one({"tenant_id": config.tenant_id}, {"$set": config_dict})
#     else:
#         await chatbot_collection.insert_one(config_dict)

#     updated = await chatbot_collection.find_one({"tenant_id": config.tenant_id})
#     if updated and "_id" in updated:
#         updated.pop("_id")
#     return updated

# @router.get("/{tenant_id}", response_model=dict)
# async def get_config(tenant_id: str, user=Depends(require_role("tenant"))):
#     if user.get("tenant_id") != tenant_id:
#         raise HTTPException(status_code=403, detail="Tenant mismatch")

#     config = await chatbot_collection.find_one({"tenant_id": tenant_id})
#     if config:
#         config.pop("_id", None)
#         return config
#     raise HTTPException(status_code=404, detail="Chatbot config not found")

# class AgentInput(BaseModel):
#     tenant_id: str
#     agent: dict

# @router.post("/add_agent_to_config", response_model=dict)
# async def add_agent_to_config(agent_input: AgentInput, user=Depends(require_role("tenant"))):
#     if user.get("tenant_id") != agent_input.tenant_id:
#         raise HTTPException(status_code=403, detail="Tenant mismatch")

#     existing = await chatbot_collection.find_one({"tenant_id": agent_input.tenant_id})
#     if not existing:
#         raise HTTPException(status_code=404, detail="Chatbot config not found")

#     agents = list(existing.get("agents", []))
#     agents.append(agent_input.agent)

#     await chatbot_collection.update_one({"tenant_id": agent_input.tenant_id}, {"$set": {"agents": agents}})
#     updated = await chatbot_collection.find_one({"tenant_id": agent_input.tenant_id})
#     updated.pop("_id", None)
#     return updated

# class FAQInput(BaseModel):
#     tenant_id: str
#     faq: Dict[str, str]

# @router.post("/add_faq_to_config", response_model=dict)
# async def add_faq_to_config(faq_input: FAQInput, user=Depends(require_role("tenant"))):
#     if user.get("tenant_id") != faq_input.tenant_id:
#         raise HTTPException(status_code=403, detail="Tenant mismatch")

#     existing = await chatbot_collection.find_one({"tenant_id": faq_input.tenant_id})
#     if not existing:
#         raise HTTPException(status_code=404, detail="Chatbot config not found")

#     faqs = list(existing.get("faqs", []))
#     faqs.append(faq_input.faq)

#     await chatbot_collection.update_one({"tenant_id": faq_input.tenant_id}, {"$set": {"faqs": faqs}})
#     updated = await chatbot_collection.find_one({"tenant_id": faq_input.tenant_id})
#     updated.pop("_id", None)
#     return updated

# class DBUrlInput(BaseModel):
#     tenant_id: str
#     db_url: str

# @router.post("/add_db_url_to_config", response_model=dict)
# async def add_db_url_to_config(db_input: DBUrlInput, user=Depends(require_role("tenant"))):
#     if user.get("tenant_id") != db_input.tenant_id:
#         raise HTTPException(status_code=403, detail="Tenant mismatch")

#     existing = await chatbot_collection.find_one({"tenant_id": db_input.tenant_id})
#     if not existing:
#         raise HTTPException(status_code=404, detail="Chatbot config not found")

#     await chatbot_collection.update_one({"tenant_id": db_input.tenant_id}, {"$set": {"db_connection": db_input.db_url}})
#     updated = await chatbot_collection.find_one({"tenant_id": db_input.tenant_id})
#     updated.pop("_id", None)
#     return updated


# from uuid import uuid4

# from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain_google_genai import GoogleGenerativeAIEmbeddings
# from PyPDF2 import PdfReader
# import docx  # python-docx
# from fastapi import APIRouter, HTTPException, UploadFile, File

# embeddings_model = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001",output_dimensionality=768)

# BASE_DIR = "knowledge_base"  # root folder for tenant files

# @router.post("/{tenant_id}/upload_rag_source")
# async def upload_rag_source(tenant_id: str, file: UploadFile = File(...)):
#     """
#     Upload a document for RAG agent.
#     Save file under knowledge_base/{tenant_id}/filename.
#     Store metadata in chatbot config.
#     """
#     # Ensure tenant folder exists
#     tenant_folder = os.path.join(BASE_DIR, tenant_id)
#     os.makedirs(tenant_folder, exist_ok=True)

#     # Save file to disk
#     file_path = os.path.join(tenant_folder, file.filename)
#     with open(file_path, "wb") as f:
#         f.write(await file.read())

#     # Build metadata
#     rag_source = {
#         "source_id": str(uuid4()),
#         "type": file.content_type,
#         "path_or_url": file_path,
#         "metadata": {"size": os.path.getsize(file_path)}
#     }

#     # Update tenant config in MongoDB
#     config = await chatbot_collection.find_one({"tenant_id": tenant_id})
#     if not config:
#         raise HTTPException(status_code=404, detail="Chatbot config not found")

#     config.setdefault("rag_sources", [])
#     config["rag_sources"].append(rag_source)

#     await chatbot_collection.update_one(
#         {"tenant_id": tenant_id},
#         {"$set": {"rag_sources": config["rag_sources"]}}
#     )

#     return {"message": "RAG source uploaded", "source": rag_source}

# @router.post("/generate_embeddings/{tenant_id}")
# async def generate_embeddings(tenant_id: str):
#     tenant_folder = os.path.join(BASE_DIR, tenant_id)
#     if not os.path.exists(tenant_folder):
#         raise HTTPException(status_code=404, detail="No files found for tenant")

#     text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
#     inserted_docs = []

#     for filename in os.listdir(tenant_folder):
#         file_path = os.path.join(tenant_folder, filename)

#         text = ""
#         if filename.endswith(".pdf"):
#             reader = PdfReader(file_path)
#             text = " ".join([page.extract_text() for page in reader.pages if page.extract_text()])
#         elif filename.endswith(".docx"):
#             doc = docx.Document(file_path)
#             text = " ".join([para.text for para in doc.paragraphs if para.text.strip()])
#         else:
#             # fallback for plain text files
#             with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
#                 text = f.read()

#         if not text.strip():
#             continue  # skip empty files

#         # Split into chunks
#         chunks = text_splitter.split_text(text)

#         # Generate embeddings for each chunk
#         for i, chunk in enumerate(chunks):
#             vector = embeddings_model.embed_query(chunk)

#             doc_record = {
#                 "tenant_id": tenant_id,
#                 "doc_id": filename,
#                 "chunk_id": f"{filename}_{i}",
#                 "text": chunk,
#                 "embedding": vector
#             }

#             embeddings_collection.insert_one(doc_record)
#             inserted_docs.append(doc_record)

#     return {"message": "Embeddings generated and stored", "count": len(inserted_docs)}






# app/api/v1/chatbot_config.py

import os
import re
import logging
from uuid import uuid4
from pathlib import Path
from typing import Any, Dict, List

import jwt
from dotenv import load_dotenv
from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

from core.db import db
from models.chatbot_config import ChatbotConfig

load_dotenv()

logger = logging.getLogger(__name__)

JWT_SECRET = os.getenv("TENANT_JWT_SECRET")
JWT_ALGO = "HS256"

CHATBOT_CONFIG_COLLECTION = os.getenv("CHATBOT_CONFIG_COLLECTION")
EMBEDDINGS_COLLECTION = os.getenv("EMBEDDINGS_COLLECTION")

if not JWT_SECRET:
    raise RuntimeError("TENANT_JWT_SECRET must be configured.")

if not CHATBOT_CONFIG_COLLECTION:
    raise RuntimeError("CHATBOT_CONFIG_COLLECTION must be configured.")

if not EMBEDDINGS_COLLECTION:
    raise RuntimeError("EMBEDDINGS_COLLECTION must be configured.")

chatbot_collection = db[CHATBOT_CONFIG_COLLECTION]
embeddings_collection = db[EMBEDDINGS_COLLECTION]

router = APIRouter()
security = HTTPBearer()

BASE_DIR = Path("knowledge_base").resolve()

# Import these only when this module is loaded by the application.
# If an optional dependency is missing, ordinary chatbot configuration
# routes can still be used; RAG endpoints return a useful error.
try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    from langchain_google_genai import GoogleGenerativeAIEmbeddings
    from PyPDF2 import PdfReader
    import docx

    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY must be configured for RAG.")

    os.environ["GOOGLE_API_KEY"] = gemini_api_key

    embeddings_model = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        output_dimensionality=768,
    )
    RAG_AVAILABLE = True

except Exception as exc:
    logger.warning("RAG dependencies are unavailable: %s", exc)
    embeddings_model = None
    RAG_AVAILABLE = False


# ---------------------------------------------------------
# Authentication
# ---------------------------------------------------------

def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        payload = jwt.decode(
            token.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGO],
        )
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")

    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_role(role: str):
    def role_checker(user=Depends(get_current_user)):
        if user.get("role") != role:
            raise HTTPException(
                status_code=403,
                detail=f"{role} role required",
            )
        return user

    return role_checker


def verify_tenant_access(tenant_id: str, user: dict):
    if user.get("tenant_id") != tenant_id:
        raise HTTPException(
            status_code=403,
            detail="Tenant mismatch",
        )


def serialize_config(config: dict) -> dict:
    result = dict(config)
    result.pop("_id", None)
    return result


# ---------------------------------------------------------
# Helpers for backward-compatible agent and FAQ data
# ---------------------------------------------------------

def normalize_agent_name(agent: dict) -> str:
    return str(agent.get("name", "")).strip().lower()


def merge_agents(
    existing_agents: list,
    incoming_agents: list,
) -> list:
    """
    Merge agents by their normalized name.

    Existing agents are retained unless the incoming payload
    contains an agent with the same name.
    """
    merged = []
    positions = {}

    for agent in existing_agents or []:
        if not isinstance(agent, dict):
            continue

        name = normalize_agent_name(agent)
        if not name:
            merged.append(agent)
            continue

        if name in positions:
            merged[positions[name]] = agent
        else:
            positions[name] = len(merged)
            merged.append(agent)

    for agent in incoming_agents or []:
        if not isinstance(agent, dict):
            continue

        name = normalize_agent_name(agent)
        if not name:
            continue

        if name in positions:
            merged[positions[name]] = {
                **merged[positions[name]],
                **agent,
            }
        else:
            positions[name] = len(merged)
            merged.append(agent)

    return merged



def normalize_faqs(value: Any) -> List[dict]:
    """Normalize legacy and modern FAQ formats to question/answer entries."""
    entries = []

    if isinstance(value, dict):
        for question, answer in value.items():
            if isinstance(answer, str):
                entries.append({
                    "question": str(question).strip(),
                    "answer": answer.strip(),
                })
            elif isinstance(answer, dict):
                q = answer.get("question", question)
                a = answer.get("answer", "")
                if isinstance(q, str) and isinstance(a, str):
                    entries.append({
                        "question": q.strip(),
                        "answer": a.strip(),
                    })

    elif isinstance(value, list):
        for item in value:
            if not isinstance(item, dict):
                continue

            # Modern FAQ format
            if isinstance(item.get("question"), str):
                question = item["question"].strip()
                answer = item.get("answer", "")
                if isinstance(answer, str) and question:
                    entries.append({
                        "question": question,
                        "answer": answer.strip(),
                    })
                continue

            # Legacy format: [{"Question": "Answer"}]
            for question, answer in item.items():
                if isinstance(question, str) and isinstance(answer, str):
                    entries.append({
                        "question": question.strip(),
                        "answer": answer.strip(),
                    })

    # Deduplicate by question, keeping the last answer.
    normalized = {}
    for item in entries:
        question = item["question"]
        answer = item["answer"]
        if question and answer:
            normalized[question] = answer

    return [
        {"question": question, "answer": answer}
        for question, answer in normalized.items()
    ]


def merge_faqs(existing: Any, incoming: Any) -> List[dict]:
    """Merge FAQ entries by question; incoming answers take precedence."""
    merged = {}

    for item in normalize_faqs(existing):
        merged[item["question"]] = item["answer"]

    for item in normalize_faqs(incoming):
        merged[item["question"]] = item["answer"]

    return [
        {"question": question, "answer": answer}
        for question, answer in merged.items()
    ]



def merge_config_payload(existing: dict, incoming: dict) -> dict:
    """
    Merge incoming chatbot fields without resetting existing agents,
    FAQs, RAG sources, workflows, or database settings just because
    the frontend sends empty defaults.

    Non-empty scalar values update the corresponding existing values.
    Agent and FAQ changes merge by their identifying names/questions.
    """
    merged = dict(existing or {})

    for field in (
        "description",
        "instruction",
        "welcome_message",
    ):
        value = incoming.get(field)
        if value is not None and value != "":
            merged[field] = value

    incoming_agents = incoming.get("agents") or []
    existing_agents = merged.get("agents") or []
    merged["agents"] = merge_agents(existing_agents, incoming_agents)

    incoming_faqs = incoming.get("faqs")
    if incoming_faqs:
        merged["faqs"] = merge_faqs(
            merged.get("faqs", []),
            incoming_faqs,
        )
    else:
        merged.setdefault("faqs", [])

    incoming_rag_sources = incoming.get("rag_sources") or []
    merged.setdefault("rag_sources", [])
    if incoming_rag_sources:
        known_ids = {
            source.get("source_id")
            for source in merged["rag_sources"]
            if isinstance(source, dict)
        }

        for source in incoming_rag_sources:
            source_id = (
                source.get("source_id")
                if isinstance(source, dict)
                else None
            )
            if not source_id or source_id not in known_ids:
                merged["rag_sources"].append(source)
                if source_id:
                    known_ids.add(source_id)

    incoming_db_url = incoming.get("db_connection")
    if incoming_db_url:
        merged["db_connection"] = incoming_db_url
    else:
        merged.setdefault("db_connection", "")

    incoming_workflows = incoming.get("workflows")
    if incoming_workflows:
        merged["workflows"] = {
            **(merged.get("workflows") or {}),
            **incoming_workflows,
        }
    else:
        merged.setdefault("workflows", {})

    return merged



def ensure_agent_exists(
    existing_agents: list,
    name: str,
    default_description: str,
) -> list:
    """Keep a configured agent and its custom description unchanged."""
    normalized_name = name.strip().lower()

    for agent in existing_agents or []:
        if (
            isinstance(agent, dict)
            and normalize_agent_name(agent) == normalized_name
        ):
            return merge_agents(existing_agents, [])

    return merge_agents(
        existing_agents,
        [{
            "name": name,
            "description": default_description,
        }],
    )


# ---------------------------------------------------------
# Chatbot configuration
# ---------------------------------------------------------

@router.post("/", response_model=dict)
async def create_or_update_config(
    config: ChatbotConfig,
    user=Depends(require_role("tenant")),
):
    verify_tenant_access(config.tenant_id, user)

    incoming = config.model_dump() if hasattr(config, "model_dump") else config.dict()

    existing = await chatbot_collection.find_one(
        {"tenant_id": config.tenant_id}
    )

    if existing:
        merged = merge_config_payload(existing, incoming)
        merged["tenant_id"] = config.tenant_id

        await chatbot_collection.update_one(
            {"tenant_id": config.tenant_id},
            {"$set": merged},
        )
    else:
        merged = {
            "id": str(uuid4()),
            "tenant_id": config.tenant_id,
            "description": incoming.get("description", ""),
            "instruction": incoming.get("instruction", ""),
            "welcome_message": incoming.get("welcome_message", ""),
            "faqs": normalize_faqs(incoming.get("faqs", [])),
            "workflows": incoming.get("workflows") or {},
            "rag_sources": incoming.get("rag_sources") or [],
            "db_connection": incoming.get("db_connection") or "",
            "agents": merge_agents([], incoming.get("agents") or []),
        }

        await chatbot_collection.insert_one(merged)

    updated = await chatbot_collection.find_one(
        {"tenant_id": config.tenant_id}
    )
    return serialize_config(updated or merged)


@router.get("/{tenant_id}", response_model=dict)
async def get_config(
    tenant_id: str,
    user=Depends(require_role("tenant")),
):
    verify_tenant_access(tenant_id, user)

    config = await chatbot_collection.find_one(
        {"tenant_id": tenant_id}
    )

    if not config:
        raise HTTPException(
            status_code=404,
            detail="Chatbot config not found",
        )

    return serialize_config(config)


# ---------------------------------------------------------
# Agent updates
# ---------------------------------------------------------

class AgentInput(BaseModel):
    tenant_id: str
    agent: Dict[str, Any]


@router.post("/add_agent_to_config", response_model=dict)
async def add_agent_to_config(
    agent_input: AgentInput,
    user=Depends(require_role("tenant")),
):
    verify_tenant_access(agent_input.tenant_id, user)

    agent = agent_input.agent
    name = normalize_agent_name(agent)

    if not name:
        raise HTTPException(
            status_code=422,
            detail="Agent name is required",
        )

    existing = await chatbot_collection.find_one(
        {"tenant_id": agent_input.tenant_id}
    )

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Chatbot config not found",
        )

    agents = merge_agents(existing.get("agents", []), [agent])

    await chatbot_collection.update_one(
        {"tenant_id": agent_input.tenant_id},
        {"$set": {"agents": agents}},
    )

    updated = await chatbot_collection.find_one(
        {"tenant_id": agent_input.tenant_id}
    )
    return serialize_config(updated or {})



# ---------------------------------------------------------
# FAQ updates
# ---------------------------------------------------------

class FAQInput(BaseModel):
    tenant_id: str
    faq: Dict[str, str] = Field(default_factory=dict)
    faqs: List[Dict[str, Any]] | None = None


@router.post("/add_faq_to_config", response_model=dict)
async def add_faq_to_config(
    faq_input: FAQInput,
    user=Depends(require_role("tenant")),
):
    verify_tenant_access(faq_input.tenant_id, user)

    existing = await chatbot_collection.find_one(
        {"tenant_id": faq_input.tenant_id}
    )

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Chatbot config not found",
        )

    # If `faqs` is supplied, treat it as the complete list.
    # This allows the frontend to remove FAQs when editing.
    if faq_input.faqs is not None:
        faqs = normalize_faqs(faq_input.faqs)
    else:
        # Backward compatibility for the existing {faq: {...}} client.
        # Merge individual FAQ additions/updates with existing entries.
        if not faq_input.faq:
            raise HTTPException(
                status_code=422,
                detail="At least one FAQ question and answer is required",
            )

        faqs = merge_faqs(
            existing.get("faqs", []),
            faq_input.faq,
        )

    await chatbot_collection.update_one(
        {"tenant_id": faq_input.tenant_id},
        {"$set": {"faqs": faqs}},
    )

    updated = await chatbot_collection.find_one(
        {"tenant_id": faq_input.tenant_id}
    )
    return serialize_config(updated or {})



# ---------------------------------------------------------
# Database connection updates
# ---------------------------------------------------------

class DBUrlInput(BaseModel):
    tenant_id: str
    db_url: str


@router.post("/add_db_url_to_config", response_model=dict)
async def add_db_url_to_config(
    db_input: DBUrlInput,
    user=Depends(require_role("tenant")),
):
    verify_tenant_access(db_input.tenant_id, user)

    existing = await chatbot_collection.find_one(
        {"tenant_id": db_input.tenant_id}
    )

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Chatbot config not found",
        )

    # agents = merge_agents(
    #     existing.get("agents", []),
    #     [{
    #         "name": "db_query",
    #         "description": "Database query agent",
    #     }],
    # )

    agents = ensure_agent_exists(
        existing.get("agents", []),
        "db_query",
        "Database query agent",
    )

    await chatbot_collection.update_one(
        {"tenant_id": db_input.tenant_id},
        {
            "$set": {
                "db_connection": db_input.db_url,
                "agents": agents,
            }
        },
    )

    updated = await chatbot_collection.find_one(
        {"tenant_id": db_input.tenant_id}
    )
    return serialize_config(updated or {})


# ---------------------------------------------------------
# RAG document upload
# ---------------------------------------------------------

def ensure_rag_available():
    if not RAG_AVAILABLE or embeddings_model is None:
        raise HTTPException(
            status_code=503,
            detail="RAG processing is unavailable. Check the RAG dependencies and GEMINI_API_KEY.",
        )


def safe_filename(filename: str) -> str:
    # Do not trust a path supplied by the client.
    name = Path(filename or "upload").name
    name = re.sub(r"[^A-Za-z0-9._ -]", "_", name).strip(" .")
    return name or f"upload-{uuid4()}"


@router.post("/{tenant_id}/upload_rag_source")
async def upload_rag_source(
    tenant_id: str,
    file: UploadFile = File(...),
    user=Depends(require_role("tenant")),
):
    verify_tenant_access(tenant_id, user)

    existing = await chatbot_collection.find_one(
        {"tenant_id": tenant_id}
    )

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Chatbot config not found",
        )

    filename = safe_filename(file.filename or "upload")
    tenant_folder = (BASE_DIR / tenant_id).resolve()

    if BASE_DIR not in tenant_folder.parents:
        raise HTTPException(
            status_code=400,
            detail="Invalid tenant folder",
        )

    tenant_folder.mkdir(parents=True, exist_ok=True)

    file_path = (tenant_folder / filename).resolve()
    if tenant_folder not in file_path.parents:
        raise HTTPException(
            status_code=400,
            detail="Invalid filename",
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=422,
            detail="The uploaded file is empty",
        )

    try:
        with open(file_path, "wb") as output:
            output.write(content)
    finally:
        await file.close()

    rag_source = {
        "source_id": str(uuid4()),
        "filename": filename,
        "type": file.content_type or "application/octet-stream",
        "path_or_url": str(file_path),
        "metadata": {"size": len(content)},
    }

    await chatbot_collection.update_one(
        {"tenant_id": tenant_id},
        {
            "$push": {"rag_sources": rag_source},
            "$set": {
                # "agents": merge_agents(
                #     existing.get("agents", []),
                #     [{
                #         "name": "rag",
                #         "description": "RAG agent to answer knowledge-based questions",
                #     }],
                # )
                "agents": ensure_agent_exists(
                    existing.get("agents", []),
                    "rag",
                    "RAG agent to answer knowledge-based questions",
                ),
            },
        },
    )

    return {
        "message": "RAG source uploaded",
        "source": rag_source,
    }


# ---------------------------------------------------------
# RAG embeddings
# ---------------------------------------------------------

@router.post("/generate_embeddings/{tenant_id}")
async def generate_embeddings(
    tenant_id: str,
    user=Depends(require_role("tenant")),
):
    verify_tenant_access(tenant_id, user)
    ensure_rag_available()

    tenant_folder = (BASE_DIR / tenant_id).resolve()

    if BASE_DIR not in tenant_folder.parents:
        raise HTTPException(
            status_code=400,
            detail="Invalid tenant folder",
        )

    if not tenant_folder.exists() or not tenant_folder.is_dir():
        raise HTTPException(
            status_code=404,
            detail="No files found for tenant",
        )

    from langchain_text_splitters import RecursiveCharacterTextSplitter
    from PyPDF2 import PdfReader
    import docx

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100,
    )

    inserted_count = 0
    failed_documents = []

    for path in tenant_folder.iterdir():
        if not path.is_file():
            continue

        try:
            suffix = path.suffix.lower()
            text = ""

            if suffix == ".pdf":
                reader = PdfReader(str(path))
                text = " ".join(
                    page.extract_text() or ""
                    for page in reader.pages
                )

            elif suffix == ".docx":
                document = docx.Document(str(path))
                text = " ".join(
                    paragraph.text
                    for paragraph in document.paragraphs
                    if paragraph.text.strip()
                )

            elif suffix in {".txt", ".md", ".csv", ".json"}:
                text = path.read_text(
                    encoding="utf-8",
                    errors="ignore",
                )

            else:
                failed_documents.append({
                    "filename": path.name,
                    "error": "Unsupported file type",
                })
                continue

            if not text.strip():
                failed_documents.append({
                    "filename": path.name,
                    "error": "No readable text found",
                })
                continue

            chunks = text_splitter.split_text(text)

            # Remove old embeddings for this file before reprocessing,
            # avoiding duplicate chunks on repeated embedding runs.
            await embeddings_collection.delete_many({
                "tenant_id": tenant_id,
                "doc_id": path.name,
            })

            for index, chunk in enumerate(chunks):
                vector = embeddings_model.embed_query(chunk)

                await embeddings_collection.insert_one({
                    "tenant_id": tenant_id,
                    "doc_id": path.name,
                    "chunk_id": f"{path.name}_{index}",
                    "text": chunk,
                    "embedding": vector,
                })

                inserted_count += 1

        except Exception as exc:
            logger.exception("Failed processing RAG file %s", path.name)
            failed_documents.append({
                "filename": path.name,
                "error": str(exc),
            })

    return {
        "message": "Embedding processing completed",
        "processed_documents": inserted_count,
        "failed_documents": failed_documents,
    }



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