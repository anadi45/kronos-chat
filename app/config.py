from pydantic import BaseSettings

class Settings(BaseSettings):
    # Database settings
    database_url: str = "sqlite:///./kronos_chat.db"
    
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