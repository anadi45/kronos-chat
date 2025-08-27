"""
Base service class for Kronos Chat Server.
"""
import logging
from abc import ABC, ABCMeta, abstractmethod
from typing import Optional, Any



class BaseService(ABC):
    """Base class for all services."""
    
    def __init__(self):
        self._initialized = False
        self._client: Optional[Any] = None
        self.logger = logging.getLogger(f"kronos.services.{self.__class__.__name__.lower()}")
    
    @property
    def initialized(self) -> bool:
        """Check if service is initialized."""
        return self._initialized
    
    @property
    def client(self) -> Any:
        """Get service client instance."""
        if not self._initialized or not self._client:
            raise RuntimeError(f"{self.__class__.__name__} not initialized")
        return self._client
    
    @abstractmethod
    def _initialize_client(self) -> None:
        """Initialize the service client. Must be implemented by subclasses."""
        pass
    
    @abstractmethod
    def _validate_configuration(self) -> None:
        """Validate service configuration. Must be implemented by subclasses."""
        pass
    
    def initialize(self) -> None:
        """Initialize the service."""
        if self._initialized:
            return
        
        try:
            self._validate_configuration()
            self._initialize_client()
            self._initialized = True
            self.logger.info(f"{self.__class__.__name__} initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize {self.__class__.__name__}: {e}")
            raise
    
    def reset(self) -> None:
        """Reset the service state."""
        self._initialized = False
        self._client = None
        self.logger.info(f"{self.__class__.__name__} reset")


class SingletonServiceMeta(ABCMeta):
    """Metaclass for singleton services that inherits from ABCMeta to resolve conflicts."""
    
    _instances = {}
    
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]


class SingletonService(BaseService, metaclass=SingletonServiceMeta):
    """Base class for singleton services."""
    pass
