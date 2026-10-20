# # # app/models/tenant.py
# # from pydantic import BaseModel
# # from typing import List, Dict, Optional

# # class Tenant(BaseModel):
# #     id: str                # UUID4 string
# #     name: str
# #     api_key: Optional[str] = None
# #     branding: Optional[Dict] = {}
# #     data_sources: Optional[List[str]] = []


# # updated code

# # app/models/tenant.py
# from pydantic import BaseModel, EmailStr
# from typing import Optional
# import uuid

# class Tenant(BaseModel):
#     id: str = str(uuid.uuid4())   # UUID4 string
#     name: str                     # Company name
#     email: EmailStr               # Admin email for login
#     hashed_password: str          # Securely stored password
#     api_key: Optional[str] = None # Issued token for widget/API usage

# class TenantSignup(BaseModel):
#     name: str
#     email: str
#     password: str

# class TenantLogin(BaseModel):
#     email: str
#     password: str



# app/models/tenant.py

from typing import Any, Dict, List, Optional
from uuid import uuid4

from pydantic import BaseModel, EmailStr, Field


class Tenant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    email: EmailStr
    hashed_password: str

    # Private API key: never expose its stored hash.
    api_key: Optional[str] = None

    # Public key used by the embedded chatbot.
    widget_key: Optional[str] = None

    branding: Dict[str, Any] = Field(default_factory=dict)
    data_sources: List[str] = Field(default_factory=list)


class TenantSignup(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class TenantLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class WidgetTokenInput(BaseModel):
    tenant_id: str = Field(min_length=1)
    widget_key: str = Field(min_length=1)
    user_id: str = Field(min_length=1, max_length=200)
