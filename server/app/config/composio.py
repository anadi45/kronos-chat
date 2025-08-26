import os
from typing import Optional

class ComposioConfig:
    """Configuration for Composio integration"""
    
    # API key for Composio - get it from https://www.composio.dev/
    API_KEY: str = os.getenv("COMPOSIO_API_KEY", "")
    
    # Base URL for Composio API
    BASE_URL: str = os.getenv("COMPOSIO_BASE_URL", "https://backend.composio.dev")
    
    # Timeout for connection requests (in seconds)
    CONNECTION_TIMEOUT: int = int(os.getenv("COMPOSIO_CONNECTION_TIMEOUT", "60"))
    
    # Supported providers
    PROVIDERS = {
        "GITHUB": "github",
        "SLACK": "slack",
        "NOTION": "notion",
        "GMAIL": "gmail",
        "GOOGLE_CALENDAR": "google_calendar",
        "TWITTER": "twitter",
        "DISCORD": "discord",
    }
    
    @classmethod
    def is_configured(cls) -> bool:
        """Check if Composio is properly configured"""
        return bool(cls.API_KEY)