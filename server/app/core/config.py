"""
Centralized configuration management for Kronos Chat Server.
"""
import os
from typing import Optional, List, Any
from pydantic import Field, validator
from pydantic_settings import BaseSettings


class DatabaseSettings(BaseSettings):
    """Database configuration settings."""
    
    url: str = Field(
        default="postgresql://kronos_user:kronos_password@localhost:5432/kronos_chat",
        env="DATABASE_URL",
        description="Database connection URL"
    )
    echo: bool = Field(
        default=False,
        env="DATABASE_ECHO",
        description="Enable SQLAlchemy query logging"
    )
    pool_size: int = Field(
        default=10,
        env="DATABASE_POOL_SIZE",
        description="Database connection pool size"
    )
    max_overflow: int = Field(
        default=20,
        env="DATABASE_MAX_OVERFLOW",
        description="Maximum overflow connections"
    )


class SecuritySettings(BaseSettings):
    """Security and authentication settings."""
    
    secret_key: str = Field(
        default="your-secret-key-here-change-in-production",
        env="SECRET_KEY",
        description="JWT secret key"
    )
    algorithm: str = Field(
        default="HS256",
        env="JWT_ALGORITHM",
        description="JWT algorithm"
    )
    access_token_expire_minutes: int = Field(
        default=30,
        env="ACCESS_TOKEN_EXPIRE_MINUTES",
        description="Access token expiration time"
    )
    allowed_hosts: List[str] = Field(
        default=["*"],
        env="ALLOWED_HOSTS",
        description="Allowed hosts for CORS"
    )


class ComposioSettings(BaseSettings):
    """Composio integration settings."""
    
    api_key: str = Field(
        default="",
        env="COMPOSIO_API_KEY",
        description="Composio API key"
    )
    base_url: str = Field(
        default="https://backend.composio.dev",
        env="COMPOSIO_BASE_URL",
        description="Composio API base URL"
    )
    connection_timeout: int = Field(
        default=60,
        env="COMPOSIO_CONNECTION_TIMEOUT",
        description="Connection timeout in seconds"
    )
    
    @validator("api_key")
    def validate_api_key(cls, v: str) -> str:
        if not v:
            raise ValueError("COMPOSIO_API_KEY is required")
        return v
    
    @property
    def is_configured(self) -> bool:
        """Check if Composio is properly configured."""
        return bool(self.api_key)





class AppSettings(BaseSettings):
    """Main application settings."""
    
    # Application info
    name: str = Field(
        default="Kronos Chat Server",
        env="APP_NAME",
        description="Application name"
    )
    version: str = Field(
        default="0.1.0",
        env="APP_VERSION",
        description="Application version"
    )
    description: str = Field(
        default="A FastAPI backend for the Kronos chat application with Composio integration",
        env="APP_DESCRIPTION"
    )
    
    # Environment
    environment: str = Field(
        default="development",
        env="ENVIRONMENT",
        description="Application environment"
    )
    debug: bool = Field(
        default=False,
        env="DEBUG",
        description="Enable debug mode"
    )
    
    # Server settings
    host: str = Field(
        default="0.0.0.0",
        env="HOST",
        description="Server host"
    )
    port: int = Field(
        default=8000,
        env="PORT",
        description="Server port"
    )
    reload: bool = Field(
        default=False,
        env="RELOAD",
        description="Enable auto-reload"
    )
    
    # API settings
    api_prefix: str = Field(
        default="/api/v1",
        env="API_PREFIX",
        description="API route prefix"
    )
    docs_url: str = Field(
        default="/docs",
        env="DOCS_URL",
        description="OpenAPI docs URL"
    )
    redoc_url: str = Field(
        default="/redoc",
        env="REDOC_URL",
        description="ReDoc URL"
    )
    openapi_url: str = Field(
        default="/openapi.json",
        env="OPENAPI_URL",
        description="OpenAPI schema URL"
    )
    
    # Logging
    log_level: str = Field(
        default="INFO",
        env="LOG_LEVEL",
        description="Logging level"
    )
    log_format: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        env="LOG_FORMAT",
        description="Log format string"
    )
    
    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.environment.lower() in ("development", "dev", "local")
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.environment.lower() in ("production", "prod")
    
    @property
    def is_testing(self) -> bool:
        """Check if running in testing mode."""
        return self.environment.lower() in ("testing", "test")


class Settings(BaseSettings):
    """Main settings class that combines all configuration sections."""
    
    # Application settings
    app: AppSettings = Field(default_factory=AppSettings)
    
    # Database settings
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    
    # Security settings
    security: SecuritySettings = Field(default_factory=SecuritySettings)
    
    # Composio settings (optional)
    composio: Optional[ComposioSettings] = None
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Initialize optional settings if environment variables are present
        try:
            self.composio = ComposioSettings()
        except ValueError:
            # Composio API key not provided, skip initialization
            pass
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        validate_assignment = True
        extra = "ignore"


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Dependency to get settings instance."""
    return settings
