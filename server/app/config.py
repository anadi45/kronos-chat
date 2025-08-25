from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database settings
    database_url: str = "postgresql://kronos_user:kronos_password@localhost:5432/kronos_chat"
    
    # API Keys
    gemini_api_key: str
    
    # JWT settings
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Application settings
    app_name: str = "Kronos Chat Server"
    debug: bool = False
    
    class Config:
        env_file = ".env"

settings = Settings()