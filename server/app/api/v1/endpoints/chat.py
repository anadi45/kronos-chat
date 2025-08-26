"""
Chat endpoints.
"""
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from typing import List, Optional
from pydantic import BaseModel
import json
import uuid
from datetime import datetime

from ....core.deps import get_current_user

router = APIRouter()


class ChatMessage(BaseModel):
    """Chat message model."""
    role: str  # "user", "assistant", "system"
    content: str
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    """Chat request model."""
    message: str
    conversation_id: Optional[str] = None
    system_prompt: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None


class ChatResponse(BaseModel):
    """Chat response model."""
    message: str
    conversation_id: str
    timestamp: str
    
    
class StreamChatRequest(BaseModel):
    """Stream chat request model."""
    message: str
    conversation_history: Optional[List[ChatMessage]] = None
    conversation_id: Optional[str] = None
    system_prompt: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None


class ConversationRequest(BaseModel):
    """Multi-turn conversation request model."""
    messages: List[ChatMessage]
    conversation_id: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None


@router.post("/message", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send a chat message and get AI response."""
    
    # Simple mock response for now
    conversation_id = request.conversation_id or f"conv_{current_user['user_id']}_{uuid.uuid4().hex[:8]}"
    
    # Generate a simple mock response
    mock_response = f"Hello! I received your message: '{request.message}'. This is a mock response from Kronos Chat. AI functionality will be implemented soon."
    
    return ChatResponse(
        message=mock_response,
        conversation_id=conversation_id,
        timestamp=datetime.utcnow().isoformat()
    )


@router.post("/stream")
async def stream_chat(
    request: StreamChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """Stream chat response in real-time."""
    
    async def event_generator():
        conversation_id = request.conversation_id or f"conv_{current_user['user_id']}_{uuid.uuid4().hex[:8]}"
        
        # Send conversation ID first
        yield f"data: {json.dumps({'type': 'conversation_id', 'data': conversation_id})}\\n\\n"
        
        # Send mock response in chunks
        mock_response = f"Hello! This is a streamed mock response to your message: '{request.message}'. AI functionality will be implemented soon."
        
        # Split response into chunks for streaming effect
        words = mock_response.split()
        for i, word in enumerate(words):
            chunk_data = {
                'type': 'content',
                'data': word + (' ' if i < len(words) - 1 else ''),
                'conversation_id': conversation_id,
                'timestamp': datetime.utcnow().isoformat()
            }
            yield f"data: {json.dumps(chunk_data)}\\n\\n"
            # Small delay for streaming effect (in real implementation, this would be natural)
            import asyncio
            await asyncio.sleep(0.1)
        
        # Send completion signal
        end_data = {
            'type': 'done',
            'conversation_id': conversation_id,
            'timestamp': datetime.utcnow().isoformat()
        }
        yield f"data: {json.dumps(end_data)}\\n\\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
    )


@router.post("/conversation", response_model=ChatResponse)
async def continue_conversation(
    request: ConversationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Continue a multi-turn conversation."""
    
    if not request.messages:
        print("At least one message is required")
        return
    
    # Get the last user message
    last_message = request.messages[-1]
    
    conversation_id = request.conversation_id or f"conv_{current_user['user_id']}_{uuid.uuid4().hex[:8]}"
    
    # Generate mock response based on conversation history
    mock_response = f"I understand you're continuing our conversation. Your last message was: '{last_message.content}'. This is a mock response. AI functionality will be implemented soon."
    
    return ChatResponse(
        message=mock_response,
        conversation_id=conversation_id,
        timestamp=datetime.utcnow().isoformat()
    )


@router.post("/analyze")
async def analyze_message(
    message: str,
    analysis_type: str = "general",
    user_id: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Analyze a message for sentiment, topics, etc."""
    
    if not message.strip():
        print("Message cannot be empty")
        return
    
    # Mock analysis response
    analysis_result = {
        "message": message,
        "analysis_type": analysis_type,
        "sentiment": "neutral",
        "topics": ["general"],
        "confidence": 0.5,
        "summary": "This is a mock analysis. AI analysis functionality will be implemented soon.",
        "timestamp": datetime.utcnow().isoformat()
    }
    
    return analysis_result