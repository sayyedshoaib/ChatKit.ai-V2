# app/models/chatbot_config.py
from pydantic import BaseModel
from typing import List, Dict, Optional

class FAQ(BaseModel):
    question: str
    answer: str

class Workflow(BaseModel):
    escalation_email: Optional[str] = None
    escalation_api: Optional[str] = None
    other_rules: Optional[Dict] = {}

class RAGSource(BaseModel):
    source_id: str                 # unique ID for the source
    type: str                      # "pdf", "doc", "link"
    path_or_url: str               # file path or URL
    metadata: Optional[Dict] = {}  # extra info (title, tags, etc.)

from typing import List, Dict, Optional
from pydantic import BaseModel

class ChatbotConfig(BaseModel):
    tenant_id: str
    welcome_message: Optional[str] = "Hello! How can I help you today?"
    faqs: List[Dict] = []
    workflows: Optional[Dict] = None        # ✅ dict or None
    rag_sources: List[str] = []
    db_connection: Optional[str] = ""     # ✅ string or None
    description: str                        # mandatory
    instruction: str                        # mandatory
    agents: List[Dict] = []                 # initially empty list

