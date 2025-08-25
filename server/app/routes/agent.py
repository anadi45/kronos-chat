from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.agent import Agent

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