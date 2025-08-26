from typing import Dict, Any, Optional, List, Union
import logging
import asyncio
from app.config.composio import ComposioConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
            from composio_client import Composio
            self._client = Composio(
                api_key=ComposioConfig.API_KEY,
                base_url=ComposioConfig.BASE_URL
            )
            self.initialized = True
            logger.info("Composio client initialized successfully")
        except ImportError as e:
            logger.warning(f"Composio package not installed: {e}")
            self.initialized = False
        except Exception as e:
            logger.error(f"Failed to initialize Composio client: {e}")
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

    # Auth Config Management Methods (based on Composio API v3)
    async def list_auth_configs(
        self,
        is_composio_managed: Optional[bool] = None,
        toolkit_slug: Optional[str] = None,
        show_disabled: bool = False,
        search: Optional[str] = None,
        limit: Optional[int] = 10,
        cursor: Optional[str] = None
    ) -> Dict[str, Any]:
        """List authentication configurations with optional filters"""
        if not self.initialized or not self._client:
            raise RuntimeError("Composio client not initialized.")
        
        try:
            params = {}
            if is_composio_managed is not None:
                params["is_composio_managed"] = str(is_composio_managed).lower()
            if toolkit_slug:
                params["toolkit_slug"] = toolkit_slug
            if show_disabled:
                params["show_disabled"] = "true"
            if search:
                params["search"] = search
            if limit:
                params["limit"] = limit
            if cursor:
                params["cursor"] = cursor

            auth_configs = self._client.auth_configs.list(**params)
            return {
                "items": auth_configs.items if hasattr(auth_configs, 'items') else auth_configs,
                "total_pages": getattr(auth_configs, 'total_pages', 1),
                "current_page": getattr(auth_configs, 'current_page', 1),
                "total_items": getattr(auth_configs, 'total_items', len(auth_configs.items) if hasattr(auth_configs, 'items') else 0),
                "next_cursor": getattr(auth_configs, 'next_cursor', None)
            }
        except Exception as e:
            logger.error(f"Failed to list auth configs: {e}")
            raise RuntimeError(f"Failed to list auth configs: {str(e)}")

    async def get_auth_config(self, auth_config_id: str) -> Dict[str, Any]:
        """Get a specific authentication configuration"""
        if not self.initialized or not self._client:
            raise RuntimeError("Composio client not initialized.")
        
        try:
            auth_config = self._client.auth_configs.get(auth_config_id)
            return {
                "id": auth_config.id,
                "uuid": getattr(auth_config, 'uuid', ''),
                "type": getattr(auth_config, 'type', 'default'),
                "toolkit": getattr(auth_config, 'toolkit', {}),
                "name": getattr(auth_config, 'name', ''),
                "status": getattr(auth_config, 'status', 'ENABLED'),
                "no_of_connections": getattr(auth_config, 'no_of_connections', 0),
                "auth_scheme": getattr(auth_config, 'auth_scheme', 'OAUTH2'),
                "is_composio_managed": getattr(auth_config, 'is_composio_managed', True),
                "created_at": getattr(auth_config, 'created_at', None),
                "last_updated_at": getattr(auth_config, 'last_updated_at', None)
            }
        except Exception as e:
            logger.error(f"Failed to get auth config {auth_config_id}: {e}")
            raise RuntimeError(f"Failed to get auth config: {str(e)}")

    async def create_auth_config(
        self,
        name: str,
        toolkit_slug: str,
        auth_scheme: str = "OAUTH2",
        credentials: Optional[Dict[str, Any]] = None,
        proxy_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a new authentication configuration"""
        if not self.initialized or not self._client:
            raise RuntimeError("Composio client not initialized.")
        
        try:
            config_data = {
                "name": name,
                "toolkit_slug": toolkit_slug,
                "auth_scheme": auth_scheme
            }
            
            if credentials:
                config_data["credentials"] = credentials
            if proxy_config:
                config_data["proxy_config"] = proxy_config

            auth_config = self._client.auth_configs.create(**config_data)
            return {
                "id": auth_config.id,
                "uuid": getattr(auth_config, 'uuid', ''),
                "name": auth_config.name,
                "status": getattr(auth_config, 'status', 'ENABLED'),
                "created_at": getattr(auth_config, 'created_at', None)
            }
        except Exception as e:
            logger.error(f"Failed to create auth config: {e}")
            raise RuntimeError(f"Failed to create auth config: {str(e)}")

    async def update_auth_config(
        self,
        auth_config_id: str,
        name: Optional[str] = None,
        credentials: Optional[Dict[str, Any]] = None,
        proxy_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Update an existing authentication configuration"""
        if not self.initialized or not self._client:
            raise RuntimeError("Composio client not initialized.")
        
        try:
            update_data = {}
            if name:
                update_data["name"] = name
            if credentials:
                update_data["credentials"] = credentials
            if proxy_config:
                update_data["proxy_config"] = proxy_config

            auth_config = self._client.auth_configs.update(auth_config_id, **update_data)
            return {
                "id": auth_config.id,
                "name": getattr(auth_config, 'name', ''),
                "status": getattr(auth_config, 'status', 'ENABLED'),
                "last_updated_at": getattr(auth_config, 'last_updated_at', None)
            }
        except Exception as e:
            logger.error(f"Failed to update auth config {auth_config_id}: {e}")
            raise RuntimeError(f"Failed to update auth config: {str(e)}")

    async def delete_auth_config(self, auth_config_id: str) -> bool:
        """Delete an authentication configuration"""
        if not self.initialized or not self._client:
            raise RuntimeError("Composio client not initialized.")
        
        try:
            self._client.auth_configs.delete(auth_config_id)
            logger.info(f"Auth config {auth_config_id} deleted successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to delete auth config {auth_config_id}: {e}")
            raise RuntimeError(f"Failed to delete auth config: {str(e)}")

    async def get_available_toolkits(
        self,
        search: Optional[str] = None,
        limit: Optional[int] = 50
    ) -> List[Dict[str, Any]]:
        """Get available toolkits/apps that can be integrated"""
        if not self.initialized or not self._client:
            raise RuntimeError("Composio client not initialized.")
        
        try:
            params = {}
            if search:
                params["search"] = search
            if limit:
                params["limit"] = limit

            toolkits = self._client.apps.list(**params)
            
            result = []
            toolkit_items = toolkits.items if hasattr(toolkits, 'items') else toolkits
            for toolkit in toolkit_items:
                result.append({
                    "slug": getattr(toolkit, 'slug', ''),
                    "name": getattr(toolkit, 'name', ''),
                    "description": getattr(toolkit, 'description', ''),
                    "logo": getattr(toolkit, 'logo', ''),
                    "categories": getattr(toolkit, 'categories', []),
                    "auth_schemes": getattr(toolkit, 'auth_schemes', [])
                })
            return result
        except Exception as e:
            logger.error(f"Failed to get available toolkits: {e}")
            raise RuntimeError(f"Failed to get available toolkits: {str(e)}")

    async def get_toolkit_actions(
        self,
        toolkit_slug: str,
        limit: Optional[int] = 50
    ) -> List[Dict[str, Any]]:
        """Get available actions for a specific toolkit"""
        if not self.initialized or not self._client:
            raise RuntimeError("Composio client not initialized.")
        
        try:
            actions = self._client.actions.list(app_name=toolkit_slug, limit=limit)
            
            result = []
            action_items = actions.items if hasattr(actions, 'items') else actions
            for action in action_items:
                result.append({
                    "name": getattr(action, 'name', ''),
                    "display_name": getattr(action, 'display_name', ''),
                    "description": getattr(action, 'description', ''),
                    "parameters": getattr(action, 'parameters', {}),
                    "response": getattr(action, 'response', {}),
                    "app_name": getattr(action, 'app_name', toolkit_slug)
                })
            return result
        except Exception as e:
            logger.error(f"Failed to get toolkit actions for {toolkit_slug}: {e}")
            raise RuntimeError(f"Failed to get toolkit actions: {str(e)}")

    async def enhanced_initiate_connection(
        self,
        user_id: str,
        app_name: str,
        auth_config_id: Optional[str] = None,
        redirect_url: Optional[str] = None,
        labels: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Enhanced connection initiation with auth config support"""
        if not self.initialized or not self._client:
            raise RuntimeError("Composio client not initialized.")
        
        try:
            connection_data = {
                "user_uuid": user_id,
                "app_name": app_name
            }
            
            if auth_config_id:
                connection_data["auth_config"] = auth_config_id
            if redirect_url:
                connection_data["redirect_url"] = redirect_url
            if labels:
                connection_data["labels"] = labels

            connection = self._client.connected_accounts.create(**connection_data)
            
            return {
                "connection_id": connection.id,
                "redirect_url": getattr(connection, 'redirectUrl', ''),
                "status": getattr(connection, 'status', 'initiated'),
                "connection_status": getattr(connection, 'connectionStatus', 'INITIATED')
            }
        except Exception as e:
            logger.error(f"Failed to initiate enhanced connection: {e}")
            raise RuntimeError(f"Failed to initiate enhanced connection: {str(e)}")

# Create singleton instance
composio_service = ComposioService()