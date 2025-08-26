from typing import Dict, Any, Optional, List
from app.config.composio import ComposioConfig

class ComposioService:
    """Service for handling Composio integrations"""
    
    _instance: Optional['ComposioService'] = None
    _client: Optional[Any] = None
    
    def __new__(cls) -> 'ComposioService':
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, 'initialized'):
            self.initialized = False
            try:
                if ComposioConfig.is_configured():
                    self._initialize_client()
                else:
                    print("Warning: Composio API key not configured. Composio integration will not work.")
            except ImportError:
                print("Warning: Composio package not installed. Composio integration will not work.")
    
    def _initialize_client(self) -> None:
        """Initialize the Composio client"""
        if self.initialized:
            return
            
        try:
            from composio import Composio
            self._client = Composio(
                api_key=ComposioConfig.API_KEY,
                base_url=ComposioConfig.BASE_URL
            )
            self.initialized = True
            print("Composio client initialized successfully")
        except ImportError:
            print("Warning: Composio package not installed. Composio integration will not work.")
            self.initialized = False
        except Exception as e:
            print(f"Failed to initialize Composio client: {e}")
            self.initialized = False
    
    def get_client(self) -> Any:
        """Get the Composio client instance"""
        if not self.initialized or not self._client:
            raise RuntimeError("Composio client not initialized. Check your API key configuration.")
        return self._client
    
    async def initiate_connection(
        self, 
        user_id: str, 
        provider: str, 
        callback_url: Optional[str] = None,
        scope: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Initiate connection with a provider (OAuth flow)"""
        if not self.initialized or not self._client:
            raise RuntimeError("Composio client not initialized.")
        
        try:
            # Create connection request
            connection_request = self._client.connected_accounts.create(
                user_id=user_id,
                app_name=provider,
                redirect_url=callback_url,
                scope=scope or []
            )
            
            return {
                "connection_id": connection_request.id,
                "redirect_url": connection_request.redirectUrl,
                "status": "initiated"
            }
        except Exception as e:
            raise RuntimeError(f"Failed to initiate connection: {str(e)}")
    
    async def wait_for_connection(
        self, 
        connection_id: str, 
        timeout: int = 60
    ) -> Dict[str, Any]:
        """Wait for a connection to be established"""
        if not self.initialized or not self._client:
            raise RuntimeError("Composio client not initialized.")
        
        try:
            # Wait for connection to be established
            connected_account = self._client.connected_accounts.wait(
                connection_id=connection_id,
                timeout=timeout
            )
            
            return {
                "account_id": connected_account.id,
                "status": connected_account.status,
                "provider": getattr(connected_account, 'appName', ''),
                "created_at": getattr(connected_account, 'createdAt', None)
            }
        except Exception as e:
            raise RuntimeError(f"Failed waiting for connection: {str(e)}")
    
    async def list_connected_accounts(self, user_id: str) -> List[Dict[str, Any]]:
        """List all connected accounts for a user"""
        if not self.initialized or not self._client:
            raise RuntimeError("Composio client not initialized.")
        
        try:
            # Get connected accounts for the user
            response = self._client.connected_accounts.get(user_id=user_id)
            accounts = response.get("items", []) if isinstance(response, dict) else response
            
            result = []
            for account in accounts:
                result.append({
                    "account_id": account.id,
                    "status": account.status,
                    "provider": getattr(account, 'appName', ''),
                    "created_at": getattr(account, 'createdAt', None)
                })
            return result
        except Exception as e:
            raise RuntimeError(f"Failed to list connected accounts: {str(e)}")
    
    async def get_connected_account(self, account_id: str) -> Dict[str, Any]:
        """Get a specific connected account"""
        if not self.initialized or not self._client:
            raise RuntimeError("Composio client not initialized.")
        
        try:
            account = self._client.connected_accounts.get_by_id(account_id=account_id)
            
            return {
                "account_id": account.id,
                "status": account.status,
                "provider": getattr(account, 'appName', ''),
                "created_at": getattr(account, 'createdAt', None),
                "updated_at": getattr(account, 'updatedAt', None)
            }
        except Exception as e:
            raise RuntimeError(f"Failed to get connected account: {str(e)}")
    
    async def enable_connected_account(self, account_id: str) -> bool:
        """Enable a connected account"""
        if not self.initialized or not self._client:
            raise RuntimeError("Composio client not initialized.")
        
        try:
            self._client.connected_accounts.enable(account_id=account_id)
            return True
        except Exception as e:
            raise RuntimeError(f"Failed to enable connected account: {str(e)}")
    
    async def disable_connected_account(self, account_id: str) -> bool:
        """Disable a connected account"""
        if not self.initialized or not self._client:
            raise RuntimeError("Composio client not initialized.")
        
        try:
            self._client.connected_accounts.disable(account_id=account_id)
            return True
        except Exception as e:
            raise RuntimeError(f"Failed to disable connected account: {str(e)}")
    
    async def refresh_connected_account(self, account_id: str) -> bool:
        """Refresh credentials for a connected account"""
        if not self.initialized or not self._client:
            raise RuntimeError("Composio client not initialized.")
        
        try:
            self._client.connected_accounts.refresh(account_id=account_id)
            return True
        except Exception as e:
            raise RuntimeError(f"Failed to refresh connected account: {str(e)}")
    
    async def delete_connected_account(self, account_id: str) -> bool:
        """Delete a connected account"""
        if not self.initialized or not self._client:
            raise RuntimeError("Composio client not initialized.")
        
        try:
            self._client.connected_accounts.delete(account_id=account_id)
            return True
        except Exception as e:
            raise RuntimeError(f"Failed to delete connected account: {str(e)}")
    
    async def execute_tool(
        self, 
        user_id: str, 
        action_name: str, 
        params: Dict[str, Any],
        connected_account_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute a tool/action"""
        if not self.initialized or not self._client:
            raise RuntimeError("Composio client not initialized.")
        
        try:
            # Execute the action
            result = self._client.actions.execute(
                action_name=action_name,
                params=params,
                entity_id=user_id,
                connected_account_id=connected_account_id
            )
            
            return {
                "success": True,
                "data": result
            }
        except Exception as e:
            raise RuntimeError(f"Failed to execute tool {action_name}: {str(e)}")

# Create singleton instance
composio_service = ComposioService()