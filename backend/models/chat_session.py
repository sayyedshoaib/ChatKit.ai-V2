from typing import Any, Dict

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)


class StartChatRequest(BaseModel):
    tenant_id: str
    user_info: Dict[str, Any] = Field(default_factory=dict)
