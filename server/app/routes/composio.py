from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

router = APIRouter(prefix="/composio", tags=["composio"])

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

# Import composio_service with error handling
try:
    from app.services.composio_service import composio_service
    COMPOSIO_AVAILABLE = True
except ImportError:
    composio_service = None
    COMPOSIO_AVAILABLE = False

def check_composio_availability():
    """Check if Composio service is available"""
    if not COMPOSIO_AVAILABLE:
        raise HTTPException(status_code=503, detail="Composio service not available")
    if not composio_service or not composio_service.initialized:
        raise HTTPException(status_code=503, detail="Composio not properly configured")

# Helper function to handle async operations
async def wait_for_connection_background(connection_id: str, timeout: int = 60):
    """Background task to wait for connection completion"""
    if not COMPOSIO_AVAILABLE or not composio_service:
        return
    try:
        result = await composio_service.wait_for_connection(connection_id, timeout)
        # In a real implementation, you might want to store this result
        # in a database or send it to a webhook
        print(f"Connection completed: {result}")
    except Exception as e:
        print(f"Connection failed: {e}")

@router.get("/health")
async def health_check():
    """Check if Composio integration is properly configured"""
    if not COMPOSIO_AVAILABLE:
        return {
            "configured": False,
            "message": "Composio package not installed"
        }
    
    if not composio_service:
        return {
            "configured": False,
            "message": "Composio service not initialized"
        }
        
    return {
        "configured": composio_service.initialized,
        "message": "Composio integration is ready" if composio_service.initialized else "Composio API key not configured"
    }

@router.post("/connections/initiate", response_model=ConnectionInitiateResponse)
async def initiate_connection(request: ConnectionInitiateRequest, background_tasks: BackgroundTasks):
    """Initiate OAuth connection with a provider"""
    check_composio_availability()
    
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
            result["connection_id"]
        )
        
        return ConnectionInitiateResponse(**result)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.get("/connections/{user_id}", response_model=List[ConnectionStatusResponse])
async def list_connections(user_id: str):
    """List all connected accounts for a user"""
    check_composio_availability()
    
    try:
        accounts = await composio_service.list_connected_accounts(user_id)
        return [ConnectionStatusResponse(**account) for account in accounts]
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.get("/connections/account/{account_id}", response_model=ConnectionStatusResponse)
async def get_connection(account_id: str):
    """Get a specific connected account"""
    check_composio_availability()
    
    try:
        account = await composio_service.get_connected_account(account_id)
        return ConnectionStatusResponse(**account)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.post("/connections/{account_id}/enable")
async def enable_connection(account_id: str):
    """Enable a connected account"""
    check_composio_availability()
    
    try:
        success = await composio_service.enable_connected_account(account_id)
        return {"success": success, "message": "Account enabled successfully"}
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.post("/connections/{account_id}/disable")
async def disable_connection(account_id: str):
    """Disable a connected account"""
    check_composio_availability()
    
    try:
        success = await composio_service.disable_connected_account(account_id)
        return {"success": success, "message": "Account disabled successfully"}
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.post("/connections/{account_id}/refresh")
async def refresh_connection(account_id: str):
    """Refresh credentials for a connected account"""
    check_composio_availability()
    
    try:
        success = await composio_service.refresh_connected_account(account_id)
        return {"success": success, "message": "Account refreshed successfully"}
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.delete("/connections/{account_id}")
async def delete_connection(account_id: str):
    """Delete a connected account"""
    check_composio_availability()
    
    try:
        success = await composio_service.delete_connected_account(account_id)
        return {"success": success, "message": "Account deleted successfully"}
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.post("/tools/execute", response_model=ToolExecuteResponse)
async def execute_tool(request: ToolExecuteRequest):
    """Execute a tool/action on a connected service"""
    check_composio_availability()
    
    try:
        result = await composio_service.execute_tool(
            user_id=request.user_id,
            action_name=request.action_name,
            params=request.params,
            connected_account_id=request.connected_account_id
        )
        return ToolExecuteResponse(success=True, data=result)
    except RuntimeError as e:
        return ToolExecuteResponse(success=False, error=str(e))
    except Exception as e:
        return ToolExecuteResponse(success=False, error=f"Unexpected error: {str(e)}")