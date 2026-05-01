# # app/models/tenant.py
# from pydantic import BaseModel
# from typing import List, Dict, Optional

# class Tenant(BaseModel):
#     id: str                # UUID4 string
#     name: str
#     api_key: Optional[str] = None
#     branding: Optional[Dict] = {}
#     data_sources: Optional[List[str]] = []


# updated code

# app/models/tenant.py
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid

class Tenant(BaseModel):
    id: str = str(uuid.uuid4())   # UUID4 string
    name: str                     # Company name
    email: EmailStr               # Admin email for login
    hashed_password: str          # Securely stored password
    api_key: Optional[str] = None # Issued token for widget/API usage

class TenantSignup(BaseModel):
    name: str
    email: str
    password: str

class TenantLogin(BaseModel):
    email: str
    password: str
