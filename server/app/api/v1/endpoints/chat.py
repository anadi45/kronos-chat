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

from ....core.deps import get_optional_gemini_service, get_current_user
from ....core.exceptions import ValidationError, ConfigurationError
from ....services.gemini_service import GeminiService

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
    """Conversation request model."""
    messages: List[ChatMessage]
    user_id: str
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None


@router.get("/")
async def get_chats():
    """Get chat conversations (placeholder)."""
    return {
        "message": "Chat endpoint",
        "note": "This is a placeholder. Implement chat history retrieval here."
    }


@router.get("/{chat_id}")
async def get_chat(chat_id: str):
    """Get specific chat conversation (placeholder)."""
    return {
        "chat_id": chat_id,
        "message": f"Details for chat {chat_id}",
        "note": "This is a placeholder. Implement specific chat retrieval here."
    }


@router.post("/message", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
    gemini_service: Optional[GeminiService] = Depends(get_optional_gemini_service)
):
    """Send a chat message and get AI response."""
    # Check if Gemini service is available
    if not gemini_service:
        raise ConfigurationError(
            "AI chat service not available. Gemini API key not configured.",
            config_key="GEMINI_API_KEY"
        )
    
    try:
        # Generate response using Gemini
        system_prompt = request.system_prompt or "You are Kronos, a helpful AI assistant. You are knowledgeable, friendly, and concise in your responses."
        
        response_text = await gemini_service.generate_text(
            prompt=request.message,
            system_prompt=system_prompt,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        # Generate conversation ID if not provided
        conversation_id = request.conversation_id or f"conv_{current_user['user_id']}_{uuid.uuid4().hex[:8]}"
        
        return ChatResponse(
            message=response_text,
            conversation_id=conversation_id,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise ValidationError(f"Failed to generate response: {str(e)}", field="ai_response")


@router.post("/stream")
async def stream_chat(
    request: StreamChatRequest,
    current_user: dict = Depends(get_current_user),
    gemini_service: Optional[GeminiService] = Depends(get_optional_gemini_service)
):
    """Stream chat response in real-time."""
    # Check if Gemini service is available
    if not gemini_service:
        raise ConfigurationError(
            "AI chat service not available. Gemini API key not configured.",
            config_key="GEMINI_API_KEY"
        )
    
    if not request.message.strip():
        raise ValidationError("Message cannot be empty", field="message")
    
    async def event_generator():
        """Generate streaming response events."""
        try:
            # Generate conversation ID if not provided
            conversation_id = request.conversation_id or f"conv_{current_user['user_id']}_{uuid.uuid4().hex[:8]}"
            
            # Send conversation ID first
            yield f"data: {json.dumps({'type': 'conversation_id', 'data': conversation_id})}\n\n"
            
            # Prepare system prompt and conversation context
            system_prompt = request.system_prompt or "You are Kronos, a helpful AI assistant. You are knowledgeable, friendly, and concise in your responses."
            
            # If conversation history is provided, format it
            if request.conversation_history:
                # Convert conversation history to a single context prompt
                conversation_context = []
                for msg in request.conversation_history:
                    if msg.role == "user":
                        conversation_context.append(f"User: {msg.content}")
                    elif msg.role == "assistant":
                        conversation_context.append(f"Assistant: {msg.content}")
                
                # Add current message
                conversation_context.append(f"User: {request.message}")
                conversation_context.append("Assistant:")
                
                full_prompt = system_prompt + "\n\n" + "\n".join(conversation_context)
            else:
                full_prompt = request.message
            
            # Stream response using Gemini
            async for chunk in gemini_service.generate_text_stream(
                prompt=full_prompt,
                system_prompt=system_prompt if not request.conversation_history else None,
                temperature=request.temperature,
                max_tokens=request.max_tokens
            ):
                # Format as server-sent events
                chunk_data = {
                    'type': 'content',
                    'data': chunk,
                    'conversation_id': conversation_id,
                    'timestamp': datetime.utcnow().isoformat()
                }
                yield f"data: {json.dumps(chunk_data)}\n\n"
            
            # Send end-of-stream marker
            end_data = {
                'type': 'done',
                'conversation_id': conversation_id,
                'timestamp': datetime.utcnow().isoformat()
            }
            yield f"data: {json.dumps(end_data)}\n\n"
            
        except Exception as e:
            # Send error as JSON
            error_data = {
                'type': 'error',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
    )


@router.post("/conversation", response_model=ChatResponse)
async def continue_conversation(
    request: ConversationRequest,
    current_user: dict = Depends(get_current_user),
    gemini_service: Optional[GeminiService] = Depends(get_optional_gemini_service)
):
    """Continue a multi-turn conversation."""
    # Check if Gemini service is available
    if not gemini_service:
        raise ConfigurationError(
            "AI chat service not available. Gemini API key not configured.",
            config_key="GEMINI_API_KEY"
        )
    
    # Validate messages
    if not request.messages:
        raise ValidationError("At least one message is required", field="messages")
    
    try:
        # Convert messages to format expected by Gemini service
        messages = []
        for msg in request.messages:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Generate response using chat completion
        response_text = await gemini_service.chat_completion(
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        # Generate conversation ID
        conversation_id = f"conv_{current_user['user_id']}_{uuid.uuid4().hex[:8]}"
        
        return ChatResponse(
            message=response_text,
            conversation_id=conversation_id,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise ValidationError(f"Failed to continue conversation: {str(e)}", field="ai_response")


@router.post("/analyze")
async def analyze_message(
    message: str,
    analysis_type: str = "general",
    user_id: str = None,
    gemini_service: Optional[GeminiService] = Depends(get_optional_gemini_service)
):
    """Analyze a message for sentiment, topics, etc."""
    if user_id:
        validate_user_id(user_id)
    
    # Check if Gemini service is available
    if not gemini_service:
        raise ValidationError(
            "AI analysis service not available. Gemini API key not configured.",
            field="gemini_service"
        )
    
    if not message.strip():
        raise ValidationError("Message cannot be empty", field="message")
    
    try:
        # Analyze text using Gemini
        analysis_result = await gemini_service.analyze_text(
            text=message,
            analysis_type=analysis_type
        )
        
        return {
            "message": message,
            "analysis_type": analysis_type,
            "result": analysis_result,
            "timestamp": __import__("datetime").datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise ValidationError(f"Failed to analyze message: {str(e)}", field="ai_analysis")
