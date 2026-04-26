from pydantic import BaseModel

class ChatMessage(BaseModel):
    sender: str   # "user" or "bot"
    text: str

class StartChatRequest(BaseModel):
    tenant_id: str
    user_info: dict = {}
