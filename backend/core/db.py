# app/core/db.py
from dotenv import load_dotenv
import os
import motor.motor_asyncio
from passlib.context import CryptContext
import hashlib

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
TENANTS_COLLECTION = os.getenv("TENANTS_COLLECTION")
CHATBOT_CONFIG_COLLECTION = os.getenv("CHATBOT_CONFIG_COLLECTION")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

# Collections
tenants_collection = db[TENANTS_COLLECTION]
chatbot_configs_collection = db[CHATBOT_CONFIG_COLLECTION]

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Tenant helper
def tenant_helper(tenant) -> dict:
    return {
        "id": tenant["id"],          # UUID field
        "name": tenant["name"],
        "email": tenant["email"],
        "api_key": tenant.get("api_key"),
    }

# Chatbot config helper
def chatbot_config_helper(config) -> dict:
    return {
        "id": config["id"],
        "tenant_id": config["tenant_id"],
        "welcome_message": config.get("welcome_message"),
        "faqs": config.get("faqs", []),
        "workflows": config.get("workflows", {}),
        "rag_sources": config.get("rag_sources", []),
        "db_connection": config.get("db_connection", {})
    }

# Password utilities
def set_password(password: str) -> str:
    # bcrypt only supports up to 72 bytes
    if len(password.encode("utf-8")) > 72:
        password = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return pwd_context.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    if len(password.encode("utf-8")) > 72:
        password = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return pwd_context.verify(password, hashed_password)
