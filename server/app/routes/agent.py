from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.agent import Agent
import asyncio

router = APIRouter(prefix="/agent", tags=["agent"])

# Initialize the agent
try:
    agent = Agent()
except Exception as e:
    print(f"Warning: Could not initialize agent: {e}")
    agent = None

class AgentRequest(BaseModel):
    message: str

class AgentResponse(BaseModel):
    response: str

@router.post("/invoke", response_model=AgentResponse)
async def invoke_agent(request: AgentRequest):
    if agent is None:
        raise HTTPException(status_code=500, detail="Agent not initialized")
    
    try:
        response = agent.invoke(request.message)
        return AgentResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stream")
async def stream_agent(request: AgentRequest):
    if agent is None:
        raise HTTPException(status_code=500, detail="Agent not initialized")
    
    async def event_generator():
        try:
            async for chunk in agent.astream(request.message):
                yield chunk
        except Exception as e:
            yield f"Error: {str(e)}\n"
    
    return StreamingResponse(event_generator(), media_type="text/plain")