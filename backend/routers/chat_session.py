# app/api/v1/chat_sessions.py
import os
from fastapi import APIRouter, HTTPException
from uuid import uuid4
from core.db import db
from models.chat_session import StartChatRequest ,ChatMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
load_dotenv()

CHAT_SESSION_COLLECTION = os.getenv("CHAT_SESSION_COLLECTION")
CHATBOT_CONFIG_COLLECTION = os.getenv("CHATBOT_CONFIG_COLLECTION")
os.environ["GEMINI_API_KEY"] = os.getenv("GEMINI_API_KEY")
os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY")

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")

router = APIRouter()

chat_sessions_collection = db[CHAT_SESSION_COLLECTION]
chatbot_collection = db[CHATBOT_CONFIG_COLLECTION]



@router.post("/start", response_model=dict)
async def start_chat(req: StartChatRequest):
    config = await chatbot_collection.find_one({"tenant_id": req.tenant_id})
    if not config:
        raise HTTPException(status_code=404, detail="Chatbot config not found")

    chat_id = str(uuid4())
    session = {
        "chat_id": chat_id,
        "tenant_id": req.tenant_id,
        "user_info": req.user_info,
        "messages": []
    }
    await chat_sessions_collection.insert_one(session)

    return {
        "chat_id": chat_id,
        "welcome_message": config.get("welcome_message"),
        "faqs": config.get("faqs", [])
    }

@router.get("/{chat_id}", response_model=dict)
async def get_chat(chat_id: str):
    session = await chat_sessions_collection.find_one({"chat_id": chat_id})
    if session:
        session.pop("_id", None)
        return session
    raise HTTPException(status_code=404, detail="Chat session not found")


@router.post("/{chat_id}/message", response_model=dict)
async def send_message(chat_id: str, message: ChatMessage):
    session = await chat_sessions_collection.find_one({"chat_id": chat_id})
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    # Append user message
    # await chat_sessions_collection.update_one(
    #     {"chat_id": chat_id},
    #     {"$push": {"messages": message.dict()}}
    # )
    # --- Step 3: Simple LLM response ---+
    try:
        response = llm.invoke(message.text)
        bot_text = response.content
        print(bot_text)
    except Exception as e:
        bot_text = f"Sorry, I couldn't process that. Error: {str(e)}"

    reply = {"sender": "bot", "text": bot_text}

    # Save bot reply to session
    # await chat_sessions_collection.update_one(
    #     {"chat_id": chat_id},
    #     {"$push": {"messages": reply}}
    # )

    return reply






# step 1 : user click the chatbot button , start_chat api hit 
# step 2 : user type a msg ans press send button send_message is hit
# step 3 : in send_message we will use langgraph workflow agents ,we will analyze user question 
# in langchain workflow , we build agents as list 
# this list will be empty 
# then we wll append faq agent(its a compusory field in chatbot config)
# then we iterate over chatbot_config.agents and add agents repectively to agent 
# then when we have the list of agents , then we build the langchain workflow based on the list,
# once the workflow(agentic architecture) then we will provide the user query/message to the graph and then wait for the reponse if the langchain gav the proper reponse we will return the reponse , if it give something like cant find answer or any  keyword then there comes another condition
# if the escalation decsription logic(email , phone , or any api where the hit the ticket request) givenm by the tenant  we will use the esacalation logic
# if not then we return the repone , cant find answer or something like that.
# as of now lets not include esalation code (it could be future scope)
# now we have step 1 and step 2 code , lets implement step 3 ,
# update send message api 
# lets start with just a simple chat reponse from llm , no langchain no agents



# Next Step: Integrate Agents into Chat Sessions
# FAQ Matching

# When a user selects or types a question that matches a configured FAQ, return the tenant’s pre‑set answer directly.

# This avoids unnecessary LLM calls and ensures consistent responses.

# RAG Agent

# If the question isn’t in FAQs, check tenant’s uploaded documents (PDFs, docs, links).

# Use FAISS (per‑tenant folder) or MongoDB Vector Search to retrieve relevant chunks.

# Pass those chunks into the LLM for a contextual answer.

# NL→SQL Agent

# If tenant has configured a DB connection, translate user question → SQL → run query → return result → convert back to natural language.

# Example: “What’s my current balance?” → SQL query → return formatted answer.

# Fallback

# If neither FAQ nor RAG nor NL→SQL applies, return a safe fallback like:
# “Sorry, I don’t have information on that. Please try asking something else.”

# 🔹 After Agents
# Once agents are integrated, you’ll want:

# Analytics Router → track session stats (FAQ usage, agent usage, escalation counts).

# Escalation Router → handle workflows (send email, call API when escalation triggers).

# Admin Dashboard APIs → let tenants view analytics, manage configs, and monitor sessions.

# 🔹 Recommended Next Router
# 👉 The immediate next router should be agent integration inside chat_sessions:

# Extend /chat/{chat_id}/message to:

# Check FAQ.

# Call RAG agent (FAISS).

# Call NL→SQL agent if configured.

# Return fallback if unrelated.