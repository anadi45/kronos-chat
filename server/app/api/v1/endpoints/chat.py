"""
Chat endpoints.
"""
from fastapi import APIRouter, Depends
from typing import List, Optional
from pydantic import BaseModel

from ....core.deps import get_optional_gemini_service, validate_user_id
from ....core.exceptions import ValidationError
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
    user_id: str
    conversation_id: Optional[str] = None
    system_prompt: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None


class ChatResponse(BaseModel):
    """Chat response model."""
    message: str
    conversation_id: str
    timestamp: str


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
    gemini_service: Optional[GeminiService] = Depends(get_optional_gemini_service)
):
    """Send a chat message and get AI response."""
    # Validate user ID
    validate_user_id(request.user_id)
    
    # Check if Gemini service is available
    if not gemini_service:
        raise ValidationError(
            "AI chat service not available. Gemini API key not configured.",
            field="gemini_service"
        )
    
    try:
        # Generate response using Gemini
        response_text = await gemini_service.generate_text(
            prompt=request.message,
            system_prompt=request.system_prompt,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        # Generate conversation ID if not provided
        conversation_id = request.conversation_id or f"conv_{request.user_id}_{__import__('uuid').uuid4().hex[:8]}"
        
        return ChatResponse(
            message=response_text,
            conversation_id=conversation_id,
            timestamp=__import__("datetime").datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise ValidationError(f"Failed to generate response: {str(e)}", field="ai_response")


@router.post("/conversation", response_model=ChatResponse)
async def continue_conversation(
    request: ConversationRequest,
    gemini_service: Optional[GeminiService] = Depends(get_optional_gemini_service)
):
    """Continue a multi-turn conversation."""
    # Validate user ID
    validate_user_id(request.user_id)
    
    # Check if Gemini service is available
    if not gemini_service:
        raise ValidationError(
            "AI chat service not available. Gemini API key not configured.",
            field="gemini_service"
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
        conversation_id = f"conv_{request.user_id}_{__import__('uuid').uuid4().hex[:8]}"
        
        return ChatResponse(
            message=response_text,
            conversation_id=conversation_id,
            timestamp=__import__("datetime").datetime.utcnow().isoformat()
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
