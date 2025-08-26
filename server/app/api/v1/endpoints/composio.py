"""
Composio integration endpoints.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query, Depends
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

from ....core.deps import get_optional_composio_service, validate_user_id
from ....core.exceptions import ComposioError, ConfigurationError, ValidationError
from ....services.composio_service import ComposioService

router = APIRouter()

# Pydantic models for request/response
class ConnectionInitiateRequest(BaseModel):
    user_id: str
    provider: str
    callback_url: Optional[str] = None
    scope: Optional[List[str]] = None

class ConnectionInitiateResponse(BaseModel):
    connection_id: str
    redirect_url: str
    status: str

class ConnectionStatusResponse(BaseModel):
    account_id: str
    status: str
    provider: str
    created_at: Optional[str] = None

class ToolExecuteRequest(BaseModel):
    user_id: str
    action_name: str
    params: Dict[str, Any]
    connected_account_id: Optional[str] = None

class ToolExecuteResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# Auth Config Models
class AuthConfigRequest(BaseModel):
    name: str = Field(..., description="Name of the auth configuration")
    toolkit_slug: str = Field(..., description="Toolkit/app slug")
    auth_scheme: str = Field(default="OAUTH2", description="Authentication scheme")
    credentials: Optional[Dict[str, Any]] = Field(None, description="Credentials for the auth config")
    proxy_config: Optional[Dict[str, Any]] = Field(None, description="Proxy configuration")

class AuthConfigUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, description="Updated name")
    credentials: Optional[Dict[str, Any]] = Field(None, description="Updated credentials")
    proxy_config: Optional[Dict[str, Any]] = Field(None, description="Updated proxy config")

class AuthConfigResponse(BaseModel):
    id: str
    uuid: str
    type: str
    toolkit: Dict[str, Any]
    name: str
    status: str
    no_of_connections: int
    auth_scheme: str
    is_composio_managed: bool
    created_at: Optional[str]
    last_updated_at: Optional[str]

class AuthConfigListResponse(BaseModel):
    items: List[AuthConfigResponse]
    total_pages: int
    current_page: int
    total_items: int
    next_cursor: Optional[str]

class ToolkitResponse(BaseModel):
    slug: str
    name: str
    description: str
    logo: str
    categories: List[str]
    auth_schemes: List[str]

class ActionResponse(BaseModel):
    name: str
    display_name: str
    description: str
    parameters: Dict[str, Any]
    response: Dict[str, Any]
    app_name: str

class EnhancedConnectionRequest(BaseModel):
    user_id: str = Field(..., description="User identifier")
    app_name: str = Field(..., description="Application/toolkit name")
    auth_config_id: Optional[str] = Field(None, description="Optional auth config ID")
    redirect_url: Optional[str] = Field(None, description="Redirect URL after OAuth")
    labels: Optional[List[str]] = Field(None, description="Labels for the connection")


def check_composio_availability(composio_service: Optional[ComposioService]):
    """Check if Composio service is available."""
    if not composio_service:
        raise ConfigurationError(
            "Composio service not available. Check COMPOSIO_API_KEY configuration.",
            config_key="COMPOSIO_API_KEY"
        )
    if not composio_service.initialized:
        raise ConfigurationError(
            "Composio service not properly initialized",
            config_key="COMPOSIO_API_KEY"
        )


# Helper function to handle async operations
async def wait_for_connection_background(composio_service: ComposioService, connection_id: str, timeout: int = 60):
    """Background task to wait for connection completion"""
    if not composio_service:
        return
    try:
        result = await composio_service.wait_for_connection(connection_id, timeout)
        # In a real implementation, you might want to store this result
        # in a database or send it to a webhook
        print(f"Connection completed: {result}")
    except Exception as e:
        print(f"Connection failed: {e}")


@router.get("/health")
async def health_check(
    composio_service: Optional[ComposioService] = Depends(get_optional_composio_service)
):
    """Check if Composio integration is properly configured"""
    if not composio_service:
        return {
            "configured": False,
            "message": "Composio API key not configured"
        }
        
    return {
        "configured": composio_service.initialized,
        "message": "Composio integration is ready" if composio_service.initialized else "Composio service not initialized"
    }


@router.post("/connections/initiate", response_model=ConnectionInitiateResponse)
async def initiate_connection(
    request: ConnectionInitiateRequest, 
    background_tasks: BackgroundTasks,
    composio_service: Optional[ComposioService] = Depends(get_optional_composio_service)
):
    """Initiate OAuth connection with a provider"""
    check_composio_availability(composio_service)
    validate_user_id(request.user_id)
    
    try:
        result = await composio_service.initiate_connection(
            user_id=request.user_id,
            provider=request.provider,
            callback_url=request.callback_url,
            scope=request.scope
        )
        
        # Add background task to wait for connection completion
        background_tasks.add_task(
            wait_for_connection_background, 
            composio_service,
            result["connection_id"]
        )
        
        return ConnectionInitiateResponse(**result)
    except Exception as e:
        raise ComposioError(f"Failed to initiate connection: {str(e)}", operation="initiate_connection")


@router.get("/connections/{user_id}", response_model=List[ConnectionStatusResponse])
async def list_connections(
    user_id: str,
    composio_service: Optional[ComposioService] = Depends(get_optional_composio_service)
):
    """List all connected accounts for a user"""
    check_composio_availability(composio_service)
    validate_user_id(user_id)
    
    try:
        accounts = await composio_service.list_connected_accounts(user_id)
        return [ConnectionStatusResponse(**account) for account in accounts]
    except Exception as e:
        raise ComposioError(f"Failed to list connections: {str(e)}", operation="list_connections")


@router.get("/connections/account/{account_id}", response_model=ConnectionStatusResponse)
async def get_connection(
    account_id: str,
    composio_service: Optional[ComposioService] = Depends(get_optional_composio_service)
):
    """Get a specific connected account"""
    check_composio_availability(composio_service)
    
    try:
        account = await composio_service.get_connected_account(account_id)
        return ConnectionStatusResponse(**account)
    except Exception as e:
        raise ComposioError(f"Failed to get connection: {str(e)}", operation="get_connection")


@router.post("/connections/{account_id}/enable")
async def enable_connection(
    account_id: str,
    composio_service: Optional[ComposioService] = Depends(get_optional_composio_service)
):
    """Enable a connected account"""
    check_composio_availability(composio_service)
    
    try:
        success = await composio_service.enable_connected_account(account_id)
        return {"success": success, "message": "Account enabled successfully"}
    except Exception as e:
        raise ComposioError(f"Failed to enable connection: {str(e)}", operation="enable_connection")


@router.post("/connections/{account_id}/disable")
async def disable_connection(
    account_id: str,
    composio_service: Optional[ComposioService] = Depends(get_optional_composio_service)
):
    """Disable a connected account"""
    check_composio_availability(composio_service)
    
    try:
        success = await composio_service.disable_connected_account(account_id)
        return {"success": success, "message": "Account disabled successfully"}
    except Exception as e:
        raise ComposioError(f"Failed to disable connection: {str(e)}", operation="disable_connection")


@router.post("/connections/{account_id}/refresh")
async def refresh_connection(
    account_id: str,
    composio_service: Optional[ComposioService] = Depends(get_optional_composio_service)
):
    """Refresh credentials for a connected account"""
    check_composio_availability(composio_service)
    
    try:
        success = await composio_service.refresh_connected_account(account_id)
        return {"success": success, "message": "Account refreshed successfully"}
    except Exception as e:
        raise ComposioError(f"Failed to refresh connection: {str(e)}", operation="refresh_connection")


@router.delete("/connections/{account_id}")
async def delete_connection(
    account_id: str,
    composio_service: Optional[ComposioService] = Depends(get_optional_composio_service)
):
    """Delete a connected account"""
    check_composio_availability(composio_service)
    
    try:
        success = await composio_service.delete_connected_account(account_id)
        return {"success": success, "message": "Account deleted successfully"}
    except Exception as e:
        raise ComposioError(f"Failed to delete connection: {str(e)}", operation="delete_connection")


@router.post("/tools/execute", response_model=ToolExecuteResponse)
async def execute_tool(
    request: ToolExecuteRequest,
    composio_service: Optional[ComposioService] = Depends(get_optional_composio_service)
):
    """Execute a tool/action on a connected service"""
    check_composio_availability(composio_service)
    validate_user_id(request.user_id)
    
    try:
        result = await composio_service.execute_tool(
            user_id=request.user_id,
            action_name=request.action_name,
            params=request.params,
            connected_account_id=request.connected_account_id
        )
        return ToolExecuteResponse(success=True, data=result)
    except Exception as e:
        return ToolExecuteResponse(success=False, error=str(e))


# Auth Config Management Endpoints
@router.get("/auth-configs", response_model=AuthConfigListResponse)
async def list_auth_configs(
    is_composio_managed: Optional[bool] = Query(None, description="Filter by composio managed"),
    toolkit_slug: Optional[str] = Query(None, description="Filter by toolkit slug"),
    show_disabled: bool = Query(False, description="Show disabled configs"),
    search: Optional[str] = Query(None, description="Search by name"),
    limit: Optional[int] = Query(10, description="Number of items per page"),
    cursor: Optional[str] = Query(None, description="Pagination cursor"),
    composio_service: Optional[ComposioService] = Depends(get_optional_composio_service)
):
    """List authentication configurations with optional filters"""
    check_composio_availability(composio_service)
    
    try:
        result = await composio_service.list_auth_configs(
            is_composio_managed=is_composio_managed,
            toolkit_slug=toolkit_slug,
            show_disabled=show_disabled,
            search=search,
            limit=limit,
            cursor=cursor
        )
        return AuthConfigListResponse(**result)
    except Exception as e:
        raise ComposioError(f"Failed to list auth configs: {str(e)}", operation="list_auth_configs")


@router.get("/auth-configs/{auth_config_id}", response_model=AuthConfigResponse)
async def get_auth_config(
    auth_config_id: str,
    composio_service: Optional[ComposioService] = Depends(get_optional_composio_service)
):
    """Get a specific authentication configuration"""
    check_composio_availability(composio_service)
    
    try:
        result = await composio_service.get_auth_config(auth_config_id)
        return AuthConfigResponse(**result)
    except Exception as e:
        raise ComposioError(f"Failed to get auth config: {str(e)}", operation="get_auth_config")


@router.post("/auth-configs", response_model=AuthConfigResponse)
async def create_auth_config(
    request: AuthConfigRequest,
    composio_service: Optional[ComposioService] = Depends(get_optional_composio_service)
):
    """Create a new authentication configuration"""
    check_composio_availability(composio_service)
    
    try:
        result = await composio_service.create_auth_config(
            name=request.name,
            toolkit_slug=request.toolkit_slug,
            auth_scheme=request.auth_scheme,
            credentials=request.credentials,
            proxy_config=request.proxy_config
        )
        # Return a simplified response for creation
        return AuthConfigResponse(
            id=result["id"],
            uuid=result.get("uuid", ""),
            type="custom",
            toolkit={"slug": request.toolkit_slug},
            name=result["name"],
            status=result.get("status", "ENABLED"),
            no_of_connections=0,
            auth_scheme=request.auth_scheme,
            is_composio_managed=False,
            created_at=result.get("created_at"),
            last_updated_at=None
        )
    except Exception as e:
        raise ComposioError(f"Failed to create auth config: {str(e)}", operation="create_auth_config")


@router.put("/auth-configs/{auth_config_id}", response_model=AuthConfigResponse)
async def update_auth_config(
    auth_config_id: str, 
    request: AuthConfigUpdateRequest,
    composio_service: Optional[ComposioService] = Depends(get_optional_composio_service)
):
    """Update an existing authentication configuration"""
    check_composio_availability(composio_service)
    
    try:
        await composio_service.update_auth_config(
            auth_config_id=auth_config_id,
            name=request.name,
            credentials=request.credentials,
            proxy_config=request.proxy_config
        )
        # Get the full updated config
        updated_config = await composio_service.get_auth_config(auth_config_id)
        return AuthConfigResponse(**updated_config)
    except Exception as e:
        raise ComposioError(f"Failed to update auth config: {str(e)}", operation="update_auth_config")


@router.delete("/auth-configs/{auth_config_id}")
async def delete_auth_config(
    auth_config_id: str,
    composio_service: Optional[ComposioService] = Depends(get_optional_composio_service)
):
    """Delete an authentication configuration"""
    check_composio_availability(composio_service)
    
    try:
        success = await composio_service.delete_auth_config(auth_config_id)
        return {"success": success, "message": "Auth config deleted successfully"}
    except Exception as e:
        raise ComposioError(f"Failed to delete auth config: {str(e)}", operation="delete_auth_config")


@router.get("/toolkits", response_model=List[ToolkitResponse])
async def get_available_toolkits(
    search: Optional[str] = Query(None, description="Search toolkits"),
    limit: Optional[int] = Query(50, description="Number of toolkits to return"),
    composio_service: Optional[ComposioService] = Depends(get_optional_composio_service)
):
    """Get available toolkits/apps that can be integrated"""
    check_composio_availability(composio_service)
    
    try:
        toolkits = await composio_service.get_available_toolkits(search=search, limit=limit)
        return [ToolkitResponse(**toolkit) for toolkit in toolkits]
    except Exception as e:
        raise ComposioError(f"Failed to get toolkits: {str(e)}", operation="get_toolkits")


@router.get("/toolkits/{toolkit_slug}/actions", response_model=List[ActionResponse])
async def get_toolkit_actions(
    toolkit_slug: str,
    limit: Optional[int] = Query(50, description="Number of actions to return"),
    composio_service: Optional[ComposioService] = Depends(get_optional_composio_service)
):
    """Get available actions for a specific toolkit"""
    check_composio_availability(composio_service)
    
    try:
        actions = await composio_service.get_toolkit_actions(toolkit_slug=toolkit_slug, limit=limit)
        return [ActionResponse(**action) for action in actions]
    except Exception as e:
        raise ComposioError(f"Failed to get toolkit actions: {str(e)}", operation="get_toolkit_actions")


@router.post("/connections/initiate-enhanced", response_model=ConnectionInitiateResponse)
async def initiate_enhanced_connection(
    request: EnhancedConnectionRequest, 
    background_tasks: BackgroundTasks,
    composio_service: Optional[ComposioService] = Depends(get_optional_composio_service)
):
    """Enhanced OAuth connection initiation with auth config support"""
    check_composio_availability(composio_service)
    validate_user_id(request.user_id)
    
    try:
        result = await composio_service.enhanced_initiate_connection(
            user_id=request.user_id,
            app_name=request.app_name,
            auth_config_id=request.auth_config_id,
            redirect_url=request.redirect_url,
            labels=request.labels
        )
        
        # Add background task to wait for connection completion
        background_tasks.add_task(
            wait_for_connection_background, 
            composio_service,
            result["connection_id"]
        )
        
        return ConnectionInitiateResponse(
            connection_id=result["connection_id"],
            redirect_url=result["redirect_url"],
            status=result["status"]
        )
    except Exception as e:
        raise ComposioError(f"Failed to initiate enhanced connection: {str(e)}", operation="initiate_enhanced_connection")
