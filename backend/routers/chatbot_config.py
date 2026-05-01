# app/api/v1/chatbot_config.py
from fastapi import APIRouter, HTTPException, UploadFile, File
from core.db import db
from models.chatbot_config import ChatbotConfig
from uuid import uuid4

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from PyPDF2 import PdfReader
import docx  # python-docx

import os
from dotenv import load_dotenv
load_dotenv()

# set api key
os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY")

CHATBOT_CONFIG_COLLECTION = os.getenv("CHATBOT_CONFIG_COLLECTION")
EMBEDDINGS_COLLECTION=os.getenv("EMBEDDINGS_COLLECTION")
INDEX_NAME=os.getenv("INDEX_NAME")

chatbot_collection = db[CHATBOT_CONFIG_COLLECTION]
embeddings_collection = db[EMBEDDINGS_COLLECTION]

router = APIRouter()

@router.post("/", response_model=dict)
async def create_or_update_config(config: ChatbotConfig):
    config_dict = {
        "id": str(uuid4()),
        "tenant_id": config.tenant_id,
        "welcome_message": config.welcome_message,
        "faqs": config.faqs,
        "workflows": config.workflows,
        "rag_sources": config.rag_sources,
        "db_connection": config.db_connection,
        "description": config.description,    # mandatory
        "instruction": config.instruction,    # mandatory
        "agents": config.agents               # starts empty
    }

    existing = await chatbot_collection.find_one({"tenant_id": config.tenant_id})
    print(f"got this: {existing}")
    if existing:
        await chatbot_collection.update_one(
            {"tenant_id": config.tenant_id},
            {"$set": config_dict}
        )
    else:
        await chatbot_collection.insert_one(config_dict)

    updated = await chatbot_collection.find_one({"tenant_id": config.tenant_id})
    if updated and "_id" in updated:
        updated.pop("_id")
    return updated




@router.get("/{tenant_id}", response_model=dict)
async def get_config(tenant_id: str):
    config = await chatbot_collection.find_one({"tenant_id": tenant_id})
    if config:
        if "_id" in config:
            config.pop("_id")   # remove ObjectId
        return config
    raise HTTPException(status_code=404, detail="Chatbot config not found")

from pydantic import BaseModel
from typing import List, Dict

class AgentInput(BaseModel):
    tenant_id: str
    agent: dict

@router.post("/add_agent_to_config", response_model=dict)
async def add_agent_to_config(agent_input: AgentInput):
    """
    Add agents to the chatbot configuration for a tenant.
    """
    tenant_id = agent_input.tenant_id
    agent = agent_input.agent
    # Find tenant config
    existing = await chatbot_collection.find_one({"tenant_id": tenant_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Chatbot config not found")
    
    agents = list(existing.get("agents",[]))
    agents.append(agent)

    # Update agents field (replace or append depending on your use case)
    await chatbot_collection.update_one(
        {"tenant_id": tenant_id},
        {"$set": {"agents": agents}}
    )

    # Fetch updated config
    updated = await chatbot_collection.find_one({"tenant_id": tenant_id})
    if updated and "_id" in updated:
        updated.pop("_id")
    return updated

BASE_DIR = "knowledge_base"  # root folder for tenant files

@router.post("/{tenant_id}/upload_rag_source")
async def upload_rag_source(tenant_id: str, file: UploadFile = File(...)):
    """
    Upload a document for RAG agent.
    Save file under knowledge_base/{tenant_id}/filename.
    Store metadata in chatbot config.
    """
    # Ensure tenant folder exists
    tenant_folder = os.path.join(BASE_DIR, tenant_id)
    os.makedirs(tenant_folder, exist_ok=True)

    # Save file to disk
    file_path = os.path.join(tenant_folder, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Build metadata
    rag_source = {
        "source_id": str(uuid4()),
        "type": file.content_type,
        "path_or_url": file_path,
        "metadata": {"size": os.path.getsize(file_path)}
    }

    # Update tenant config in MongoDB
    config = await chatbot_collection.find_one({"tenant_id": tenant_id})
    if not config:
        raise HTTPException(status_code=404, detail="Chatbot config not found")

    config.setdefault("rag_sources", [])
    config["rag_sources"].append(rag_source)

    await chatbot_collection.update_one(
        {"tenant_id": tenant_id},
        {"$set": {"rag_sources": config["rag_sources"]}}
    )

    return {"message": "RAG source uploaded", "source": rag_source}

embeddings_model = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001",output_dimensionality=768)

@router.post("/generate_embeddings/{tenant_id}")
async def generate_embeddings(tenant_id: str):
    tenant_folder = os.path.join(BASE_DIR, tenant_id)
    if not os.path.exists(tenant_folder):
        raise HTTPException(status_code=404, detail="No files found for tenant")

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    inserted_docs = []

    for filename in os.listdir(tenant_folder):
        file_path = os.path.join(tenant_folder, filename)

        text = ""
        if filename.endswith(".pdf"):
            reader = PdfReader(file_path)
            text = " ".join([page.extract_text() for page in reader.pages if page.extract_text()])
        elif filename.endswith(".docx"):
            doc = docx.Document(file_path)
            text = " ".join([para.text for para in doc.paragraphs if para.text.strip()])
        else:
            # fallback for plain text files
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()

        if not text.strip():
            continue  # skip empty files

        # Split into chunks
        chunks = text_splitter.split_text(text)

        # Generate embeddings for each chunk
        for i, chunk in enumerate(chunks):
            vector = embeddings_model.embed_query(chunk)

            doc_record = {
                "tenant_id": tenant_id,
                "doc_id": filename,
                "chunk_id": f"{filename}_{i}",
                "text": chunk,
                "embedding": vector
            }

            embeddings_collection.insert_one(doc_record)
            inserted_docs.append(doc_record)

    return {"message": "Embeddings generated and stored", "count": len(inserted_docs)}


@router.post("/query_embeddings/{tenant_id}")
async def query_embeddings(tenant_id: str, query: str, k: int = 5, num_candidates: int = 100):
    """
    Run a semantic search for a tenant's documents using MongoDB Atlas $vectorSearch.
    """
    # Generate embedding for the query
    query_vector = embeddings_model.embed_query(query)

    # Build pipeline with new $vectorSearch operator
    pipeline = [
        {
            "$vectorSearch": {
                "index": INDEX_NAME,          # <-- replace with your actual index name
                "path": "embedding",         # field where vectors are stored
                "queryVector": query_vector, # array of floats
                "numCandidates": num_candidates,
                "limit": k
            }
        },
        {"$match": {"tenant_id": tenant_id}},
        {"$project": {"text": 1, "doc_id": 1, "chunk_id": 1, "_id": 0}}
    ]

    # Run aggregation with Motor (async)
    results = await embeddings_collection.aggregate(pipeline).to_list(length=k)
    # results = results[].replace('\n','')

    if not results:
        raise HTTPException(status_code=404, detail="No matching chunks found")

    return {"matches": results}












# 🔹 Current Code Scope
# The example ingestion API I gave only handled PDFs and plain text files. That’s because:

# PDFs → PyPDF2 can extract text.

# .txt → simple file read.

# It doesn’t yet handle DOCX, PPTX, Excel, Google Docs/Slides, or images.

# 🔹 Handling Other File Types
# DOCX (Word) → use python-docx or docx2txt to extract text.

# PPTX (PowerPoint) → use python-pptx to read slide text.

# Excel (XLSX/CSV) → use openpyxl or pandas to read cells/tables.

# Google Docs/Slides → requires Google Drive API integration (OAuth, download as DOCX/PPTX).

# Images (JPEG/PNG) → need OCR (e.g., pytesseract) to extract text.

# Structured data (tables) → you can flatten into text or serialize into JSON before embedding.

# 🔹 Is It Necessary for Initial Development?
# No — for initial development, it’s best to start with PDFs and plain text.
# Here’s why:

# They cover the majority of knowledge base use cases (manuals, FAQs, reports).

# Extraction is straightforward.

# Keeps your ingestion pipeline simple and stable.

# You can add support for DOCX/PPTX later once the core pipeline works.

# Images, tables, and structured data are advanced features. They require OCR, schema design, and possibly multimodal embeddings (gemini-embedding-2). That’s not essential for your MVP.

# 🔹 Recommended Approach
# Phase 1 (MVP) → Support PDFs + .txt files.

# Phase 2 → Add DOCX + PPTX (common in enterprise).

# Phase 3 → Add Excel/CSV for structured data.

# Phase 4 → Add OCR for images, multimodal embeddings if needed.