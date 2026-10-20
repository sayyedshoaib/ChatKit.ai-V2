import os

from fastapi import HTTPException
from core.db import db
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_genai import GoogleGenerativeAIEmbeddings

import asyncio

from google.genai import types
from google.adk.agents.llm_agent import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService

from langchain_community.utilities.sql_database import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent
from langchain_community.tools.sql_database.tool import QuerySQLCheckerTool
from google.adk.tools import ToolContext
from sqlalchemy import create_engine, inspect


from dotenv import load_dotenv
load_dotenv()

CHAT_SESSION_COLLECTION = os.getenv("CHAT_SESSION_COLLECTION") #can be used to provide chat history to llm for better context
CHATBOT_CONFIG_COLLECTION = os.getenv("CHATBOT_CONFIG_COLLECTION")
EMBEDDINGS_COLLECTION=os.getenv("EMBEDDINGS_COLLECTION")
INDEX_NAME=os.getenv("INDEX_NAME")

os.environ["GEMINI_API_KEY"] = os.getenv("GEMINI_API_KEY")
os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY")

chat_sessions_collection = db[CHAT_SESSION_COLLECTION]
chatbot_collection = db[CHATBOT_CONFIG_COLLECTION]
embeddings_collection = db[EMBEDDINGS_COLLECTION]

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")
embeddings_model = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001",output_dimensionality=768)



async def run_orchestrator(tenant_id: str, user_query: str):
    # 1. Fetch tenant config
    config = await chatbot_collection.find_one({"tenant_id": tenant_id})
    if not config:
        return {"text": "No chatbot config found."}

    # faq_database = {
    #         "where is my order?": "You can track your order using the tracking link sent to your email.",
    #         "what is your return policy?": "You can return any item within 30 days of purchase for a full refund.",
    #         "do you offer international shipping?": "Yes, we offer international shipping to select countries"
    #     }

    faq_database = config.get("faqs", [])
    # 1. FAQ agent (always present)
    def faq_agent(user_query: str) -> str:
        # faq_prompt = "You are an FAQ agent that answers common questions based on stored FAQs. Use find_FAQ_Answer(user_query) tool to find the most relevant FAQ and answer the user's query. If"

        faq_prompt = f"You are an FAQ agent that answers common questions based on stored FAQs. Here are the FAQs you have: {faq_database}. Answer the user's query : {user_query} based on these FAQs. If you cannot find a relevant FAQ, say you cannot find an answer and suggest contacting support."
        return LlmAgent(
            name="FAQAgent",
            model="gemini-2.5-flash",
            description=faq_prompt,
    )

    #2. RAG Tool
    async def query_embeddings(query: str):
        """
        Run a semantic search for a tenant's documents using MongoDB Atlas $vectorSearch.
        """
        k = 5
        num_candidates = 100

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
        results = results[0]["text"].replace('\n','') if results else ""

        awnser_generation_prompt = f"You are a RAG agent. A user has asked the question: {user_query}. You have access to the following relevant chunks of information from the tenant's documents: {results}. Use this information to generate a helpful and accurate answer to the user's question. If you cannot find relevant information in the provided chunks, say you cannot find an answer and suggest contacting support."
        answer = llm.invoke(awnser_generation_prompt)
        answer = answer.content if answer else "Cannot process this query as it is out of scope for me. Please contact support for further assistance."

        if not results:
            # raise HTTPException(status_code=404, detail="No matching chunks found")
            return {"text": "No relevant information found in the documents."}

        return {"text": answer}
    
    # RAG agent
    def rag_agent(user_query: str) -> str:
        
        rag_prompt = f"You are a RAG agent. A user has asked the question: {user_query}. You have access to a tool called query_embeddings(tenant_id, query) that allows you to retrieve relevant chunks of information from the tenant's documents. Use this tool to find relevant information and generate a helpful and accurate answer to the user's question. If you cannot find relevant information, say you cannot find an answer and suggest contacting support."
        return LlmAgent(
            name="RAGAgent",
            model="gemini-2.5-flash",
            description=rag_prompt,
            tools=[query_embeddings]
        )
    

    # DB QUERY AGENT
    async def generate_sql(context: ToolContext, user_query: str):

        db_url = agent.get_metadata("db_url", "")
        if not db_url:
            return {"text": "Database URL not provided in agent metadata."}

        engine = create_engine(db_url, pool_pre_ping=True)
        db = SQLDatabase(engine)

        agent = create_sql_agent(llm=llm, db=db, verbose=True)
        sql_query = agent.run(user_query)

        print(f"sql_query : {sql_query}")
        query_checker = QuerySQLCheckerTool(db=db,llm=llm)

        checked_query = query_checker.invoke({"query":sql_query,"dialect":db.dialect})

        context.state["sql"] = checked_query
        return {"text": f"Generated SQL: {checked_query}"}


    async def execute_sql(context: ToolContext):
        db_url = agent.get_metadata("db_url", "")
        if not db_url:
            return {"text": "Database URL not provided in agent metadata."}
        
        sql_query = context.state.get("sql", "")
        if not sql_query:
            return {"text": "No SQL query found in state."}

        engine = create_engine(db_url, pool_pre_ping=True)

        # Execute SQL
        with engine.connect() as conn:
            result = conn.execute(sql_query)
            rows = [dict(r) for r in result]
        context.state["results"] = rows

        return {"text": f"Executed SQL. Rows: {rows}"}

    # DB Query Agent Factory
    def db_query_agent(user_query: str) -> LlmAgent:
        return LlmAgent(
            name="DBQueryAgent",
            model="gemini-2.5-flash",
            description=f"Agent that generates SQL from natural language queries, validates and executes them, and returns natural language answers if results are found. Use generate_sql tool to generate and validate SQL queries, and execute_sql tool to run the validated SQL against the database. Always provide a natural language answer based on the results returned from the database. If no results are found, say you cannot find an answer and suggest contacting support. user_query: {user_query}",
            tools=[generate_sql, execute_sql]
        )



    agents_info = []

    # 3. Add tenant agents
    sub_agents = []
    for agent in config.get("agents", []):
        if agent["name"] == "rag":
            sub_agents.append(rag_agent(user_query))
            agents_info.append({"name": agent["name"], "description": agent.get("description", "")})
        elif agent["name"] == "db_query":
                    db_url = agent.get("db_url", "")
                    sub_agents.append(db_query_agent(user_query))
                    agents_info.append({"name": agent["name"], "description": f"DB Query agent that can execute natural language queries on a database with url {db_url}. Extra information about the database: {agent.get('description', '')}"})
        # elif agent["name"] == "faq":
        #     faq_desc_prompt = f"Generate a short description for an FAQ agent with these Faqs: {faq_database}."
        #     faq_response = llm.invoke(faq_desc_prompt)
        #     sub_agents.append(faq_agent(user_query))
        #     agents_info.append({"name": agent["name"], "description": faq_response.content if faq_response else "FAQ agent that answers common questions."})
        

    # 4. Orchestrator agent
    orchestrator_instructions = f"You are an orchestrator/deligator agent. You have these agents with you: {agents_info}. Delegate the task to the suitable agent. If you cannot find a suitable agent, say you cannot find an answer and suggest contacting support. You can answer greeting and small talk questions yourself. User query: {user_query}"
    root_agent = LlmAgent(
        name="Coordinator",
        model="gemini-2.5-flash",
        description=orchestrator_instructions,
        sub_agents=sub_agents
    )

    # 5. Runner setup
    APP_NAME = "ChatKit"
    USER_ID = tenant_id
    SESSION_ID = "session_" + tenant_id

    session_service = InMemorySessionService()
    await session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID)

    runner = Runner(agent=root_agent, app_name=APP_NAME, session_service=session_service)

    # 6. Run orchestrator (async)
    content = types.Content(role="user", parts=[types.Part(text=user_query)])
    final_answer = "Out of scope."

    async for event in runner.run_async(user_id=USER_ID, session_id=SESSION_ID, new_message=content):
        if event.is_final_response() and event.content and event.content.parts:
            final_answer = event.content.parts[0].text.strip()

    return {"text": final_answer}


if __name__ == "__main__":
    result = asyncio.run(run_orchestrator(tenant_id="99fae6f3-80b1-4dba-a332-20195442c842", user_query="Where is my order?"))
    # result = asyncio.run(run_orchestrator(tenant_id="99fae6f3-80b1-4dba-a332-20195442c842", user_query="total products available?"))
    # result = asyncio.run(run_orchestrator(tenant_id="99fae6f3-80b1-4dba-a332-20195442c842", user_query="who is elon musk?"))
    print(result)
