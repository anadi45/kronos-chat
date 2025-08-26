"""
LangGraph agent endpoints.
"""
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

from ....core.deps import get_optional_gemini_service, validate_user_id
from ....core.exceptions import ValidationError, ConfigurationError
from ....services.gemini_service import GeminiService

router = APIRouter()


class AgentRequest(BaseModel):
    """Agent request model."""
    message: str
    user_id: str
    context: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None


class AgentResponse(BaseModel):
    """Agent response model."""
    response: str
    user_id: str
    timestamp: str


@router.post("/invoke", response_model=AgentResponse)
async def invoke_agent(
    request: AgentRequest,
    gemini_service: Optional[GeminiService] = Depends(get_optional_gemini_service)
):
    """
    Invoke the AI agent for a single response.
    
    This endpoint processes a user message through the AI agent and returns
    a complete response. For streaming responses, use the /stream endpoint.
    """
    # Validate user ID
    validate_user_id(request.user_id)
    
    # Check if Gemini service is available
    if not gemini_service:
        raise ConfigurationError(
            "AI agent service not available. Gemini API key not configured.",
            config_key="GEMINI_API_KEY"
        )
    
    if not request.message.strip():
        raise ValidationError("Message cannot be empty", field="message")
    
    try:
        # Prepare system prompt for agent context
        system_prompt = "You are Kronos, an intelligent AI assistant. You are helpful, accurate, and friendly."
        if request.context:
            system_prompt += f" Additional context: {request.context}"
        
        # Generate response using Gemini
        response_text = await gemini_service.generate_text(
            prompt=request.message,
            system_prompt=system_prompt,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        return AgentResponse(
            response=response_text,
            user_id=request.user_id,
            timestamp=__import__("datetime").datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise ValidationError(f"Agent invocation failed: {str(e)}", field="agent_response")


@router.post("/stream")
async def stream_agent(
    request: AgentRequest,
    gemini_service: Optional[GeminiService] = Depends(get_optional_gemini_service)
):
    """
    Stream AI agent response in real-time.
    
    This endpoint processes a user message through the AI agent and streams
    the response as it's generated, providing a real-time chat experience.
    """
    # Validate user ID
    validate_user_id(request.user_id)
    
    # Check if Gemini service is available
    if not gemini_service:
        raise ConfigurationError(
            "AI agent service not available. Gemini API key not configured.",
            config_key="GEMINI_API_KEY"
        )
    
    if not request.message.strip():
        raise ValidationError("Message cannot be empty", field="message")
    
    async def event_generator():
        """Generate streaming response events."""
        try:
            # Prepare system prompt for agent context
            system_prompt = "You are Kronos, an intelligent AI assistant. You are helpful, accurate, and friendly."
            if request.context:
                system_prompt += f" Additional context: {request.context}"
            
            # Stream response using Gemini
            async for chunk in gemini_service.generate_text_stream(
                prompt=request.message,
                system_prompt=system_prompt,
                temperature=request.temperature,
                max_tokens=request.max_tokens
            ):
                # Format as server-sent events
                yield f"data: {chunk}\n\n"
            
            # Send end-of-stream marker
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            # Send error as JSON
            import json
            error_data = {
                "error": str(e),
                "timestamp": __import__("datetime").datetime.utcnow().isoformat()
            }
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )


@router.post("/analyze-intent")
async def analyze_intent(
    message: str,
    user_id: str = None,
    gemini_service: Optional[GeminiService] = Depends(get_optional_gemini_service)
):
    """
    Analyze user intent from a message.
    
    This endpoint analyzes the user's message to determine their intent,
    which can be used for routing to appropriate handlers or actions.
    """
    if user_id:
        validate_user_id(user_id)
    
    # Check if Gemini service is available
    if not gemini_service:
        raise ConfigurationError(
            "Intent analysis service not available. Gemini API key not configured.",
            config_key="GEMINI_API_KEY"
        )
    
    if not message.strip():
        raise ValidationError("Message cannot be empty", field="message")
    
    try:
        # Analyze intent using Gemini
        intent_prompt = f"""
        Analyze the following user message and determine their intent. 
        Respond with JSON containing:
        - "intent": the primary intent (e.g., "question", "request", "complaint", "greeting")
        - "confidence": confidence score from 0-1
        - "entities": any important entities mentioned
        - "action": suggested action to take
        
        User message: {message}
        """
        
        analysis_result = await gemini_service.analyze_text(
            text=intent_prompt,
            analysis_type="general"
        )
        
        return {
            "message": message,
            "intent_analysis": analysis_result,
            "timestamp": __import__("datetime").datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise ValidationError(f"Intent analysis failed: {str(e)}", field="intent_analysis")


@router.get("/capabilities")
async def get_agent_capabilities():
    """
    Get information about the agent's capabilities.
    
    Returns information about what the AI agent can do,
    available features, and usage guidelines.
    """
    return {
        "name": "Kronos AI Assistant",
        "version": "1.0.0",
        "capabilities": [
            "Natural language conversation",
            "Question answering",
            "Text analysis and summarization",
            "Intent recognition",
            "Multi-turn dialogue",
            "Streaming responses"
        ],
        "features": [
            "Real-time streaming responses",
            "Context-aware conversations", 
            "Intent analysis",
            "Configurable response parameters",
            "User session management"
        ],
        "limits": {
            "max_message_length": 4000,
            "max_tokens_per_response": 2000,
            "temperature_range": [0.0, 1.0]
        },
        "supported_languages": ["English"],
        "model_info": {
            "provider": "Google Gemini",
            "model": "gemini-pro"
        }
    }
