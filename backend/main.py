
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers
from routers import tenants
from routers import chatbot_config
from routers import chat_session
from routers import analytics


app = FastAPI(title="ChatKit.ai SaaS Platform")


# CORS configuration
frontend_url = os.getenv("FRONTEND_URL", "").strip()

origins = [
    "http://localhost:3000",  # Create React App development server
    "http://localhost:5173",  # Vite development server, if needed
]

# Add the deployed frontend origin when configured.
if frontend_url:
    origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health", tags=["system"])
async def health_check():
    return {
        "status": "ok",
        "message": "ChatKit.ai SaaS Platform is running",
    }


# Register routers
app.include_router(
    tenants.router,
    prefix="/tenants",
    tags=["tenants"],
)

app.include_router(
    chatbot_config.router,
    prefix="/chatbot_config",
    tags=["chatbot_config"],
)

app.include_router(
    chat_session.router,
    prefix="/chat_session",
    tags=["chat_session"],
)

app.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["analytics"],
)
