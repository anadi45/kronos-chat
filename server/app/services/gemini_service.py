"""
Google Gemini AI service for Kronos Chat Server.
"""
from typing import Dict, Any, Optional, List

from ..core.config import get_settings
from ..core.exceptions import GeminiError, ConfigurationError
from .base import SingletonService

settings = get_settings()


class GeminiService(SingletonService):
    """Service for handling Google Gemini AI operations."""
    
    def _validate_configuration(self) -> None:
        """Validate Gemini configuration."""
        if not settings.gemini:
            raise ConfigurationError(
                "Gemini configuration not found. Check GEMINI_API_KEY environment variable.",
                config_key="GEMINI_API_KEY"
            )
        
        if not settings.gemini.api_key:
            raise ConfigurationError(
                "Gemini API key not configured. Set GEMINI_API_KEY environment variable.",
                config_key="GEMINI_API_KEY"
            )
    
    def _initialize_client(self) -> None:
        """Initialize the Gemini client."""
        try:
            import google.generativeai as genai
            
            # Configure the client
            genai.configure(api_key=settings.gemini.api_key)
            
            # Initialize the model
            self._client = genai.GenerativeModel(settings.gemini.model)
            
            # Test the connection
            self._test_connection()
            
        except ImportError as e:
            self.logger.error(f"Gemini package not installed: {e}")
            raise ConfigurationError(
                "google-generativeai package not installed. Run: pip install google-generativeai",
                config_key="GEMINI_PACKAGE"
            )
        except Exception as e:
            self.logger.error(f"Failed to initialize Gemini client: {e}")
            raise GeminiError(f"Failed to initialize Gemini client: {str(e)}")
    
    def _test_connection(self) -> None:
        """Test the Gemini API connection."""
        try:
            # Simple test prompt
            response = self._client.generate_content("Hello")
            if not response.text:
                raise GeminiError("Empty response from Gemini API")
            self.logger.info("Gemini API connection test successful")
        except Exception as e:
            self.logger.error(f"Gemini API connection test failed: {e}")
            raise GeminiError(f"Gemini API connection test failed: {str(e)}")
    
    async def generate_text(
        self,
        prompt: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        """
        Generate text using Gemini AI.
        
        Args:
            prompt: The input prompt
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens to generate
            system_prompt: Optional system prompt for context
            
        Returns:
            str: Generated text
            
        Raises:
            GeminiError: If generation fails
        """
        if not self.initialized:
            raise GeminiError("Gemini service not initialized")
        
        try:
            # Prepare the full prompt
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"{system_prompt}\n\nUser: {prompt}\nAssistant:"
            
            # Generate content
            response = self.client.generate_content(
                full_prompt,
                generation_config={
                    "temperature": temperature or settings.gemini.temperature,
                    "max_output_tokens": max_tokens or settings.gemini.max_tokens,
                }
            )
            
            if not response.text:
                raise GeminiError("Empty response from Gemini API")
            
            self.logger.info(f"Generated text successfully (prompt length: {len(prompt)})")
            return response.text.strip()
            
        except Exception as e:
            self.logger.error(f"Failed to generate text: {e}")
            raise GeminiError(f"Failed to generate text: {str(e)}", operation="generate_text")
    
    async def generate_text_stream(
        self,
        prompt: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        system_prompt: Optional[str] = None
    ):
        """
        Generate text using Gemini AI with streaming.
        
        Args:
            prompt: The input prompt
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens to generate
            system_prompt: Optional system prompt for context
            
        Yields:
            str: Generated text chunks
            
        Raises:
            GeminiError: If generation fails
        """
        if not self.initialized:
            raise GeminiError("Gemini service not initialized")
        
        try:
            # Prepare the full prompt
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"{system_prompt}\n\nUser: {prompt}\nAssistant:"
            
            # Generate content with streaming
            response = self.client.generate_content(
                full_prompt,
                generation_config={
                    "temperature": temperature or settings.gemini.temperature,
                    "max_output_tokens": max_tokens or settings.gemini.max_tokens,
                },
                stream=True
            )
            
            for chunk in response:
                if chunk.text:
                    yield chunk.text
            
            self.logger.info(f"Generated text stream successfully (prompt length: {len(prompt)})")
            
        except Exception as e:
            self.logger.error(f"Failed to generate text stream: {e}")
            raise GeminiError(f"Failed to generate text stream: {str(e)}", operation="generate_text_stream")
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Complete a chat conversation.
        
        Args:
            messages: List of chat messages with 'role' and 'content' keys
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens to generate
            
        Returns:
            str: Assistant's response
            
        Raises:
            GeminiError: If chat completion fails
        """
        if not self.initialized:
            raise GeminiError("Gemini service not initialized")
        
        try:
            # Convert messages to a single prompt
            # Gemini doesn't have native chat format, so we'll construct it
            prompt_parts = []
            
            for message in messages:
                role = message.get("role", "user")
                content = message.get("content", "")
                
                if role == "system":
                    prompt_parts.append(f"System: {content}")
                elif role == "user":
                    prompt_parts.append(f"User: {content}")
                elif role == "assistant":
                    prompt_parts.append(f"Assistant: {content}")
            
            # Add final assistant prompt
            prompt_parts.append("Assistant:")
            full_prompt = "\n\n".join(prompt_parts)
            
            # Generate response
            response = self.client.generate_content(
                full_prompt,
                generation_config={
                    "temperature": temperature or settings.gemini.temperature,
                    "max_output_tokens": max_tokens or settings.gemini.max_tokens,
                }
            )
            
            if not response.text:
                raise GeminiError("Empty response from Gemini API")
            
            self.logger.info(f"Chat completion successful (messages: {len(messages)})")
            return response.text.strip()
            
        except Exception as e:
            self.logger.error(f"Failed to complete chat: {e}")
            raise GeminiError(f"Failed to complete chat: {str(e)}", operation="chat_completion")
    
    async def analyze_text(
        self,
        text: str,
        analysis_type: str = "general"
    ) -> Dict[str, Any]:
        """
        Analyze text for various purposes.
        
        Args:
            text: Text to analyze
            analysis_type: Type of analysis (sentiment, summary, etc.)
            
        Returns:
            dict: Analysis results
            
        Raises:
            GeminiError: If analysis fails
        """
        if not self.initialized:
            raise GeminiError("Gemini service not initialized")
        
        try:
            # Prepare analysis prompt based on type
            prompts = {
                "sentiment": f"Analyze the sentiment of this text. Respond with JSON containing 'sentiment' (positive/negative/neutral), 'confidence' (0-1), and 'explanation': {text}",
                "summary": f"Provide a concise summary of this text in 2-3 sentences: {text}",
                "keywords": f"Extract the key topics and keywords from this text. Respond with JSON containing 'keywords' array and 'topics' array: {text}",
                "general": f"Analyze this text and provide insights about its content, tone, and main points: {text}"
            }
            
            prompt = prompts.get(analysis_type, prompts["general"])
            
            response = self.client.generate_content(prompt)
            
            if not response.text:
                raise GeminiError("Empty response from Gemini API")
            
            # Try to parse as JSON for structured responses
            result = {"analysis": response.text.strip()}
            
            if analysis_type in ["sentiment", "keywords"]:
                try:
                    import json
                    result = json.loads(response.text.strip())
                except json.JSONDecodeError:
                    # If not valid JSON, return as text
                    result = {"analysis": response.text.strip(), "format": "text"}
            
            self.logger.info(f"Text analysis successful (type: {analysis_type})")
            return result
            
        except Exception as e:
            self.logger.error(f"Failed to analyze text: {e}")
            raise GeminiError(f"Failed to analyze text: {str(e)}", operation="analyze_text")


# Create singleton instance
gemini_service = GeminiService()
