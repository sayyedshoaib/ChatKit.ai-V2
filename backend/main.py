# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# routers import
from routers import tenants
from routers import chatbot_config
from routers import chat_session

app = FastAPI(title="Chatbot SaaS Platform")

# Allow frontend origin (adjust as needed)
origins = [
    "http://localhost:3000",  # CRA dev server
    "http://localhost:5173",  # Vite dev server (if you switch later)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # or ["*"] during dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health", tags=["system"])
async def health_check():
    return {"status": "ok", "message": "Chatbot SaaS Platform is running"}

# include tenants router
app.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
app.include_router(chatbot_config.router, prefix="/chatbot_config", tags=["chatbot_config"])
app.include_router(chat_session.router, prefix="/chat_session", tags=["chat_session"])


