"""
Integration dashboard and management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List

from ....core.deps import get_current_user, get_database_session
from ....core.exceptions import ComposioError, ValidationError
from ....schemas.integration import (
    IntegrationDashboard, IntegrationStats, IntegrationSummary,
    IntegrationActionRequest, IntegrationActionResponse
)
from ....services.integration_service import integration_service
from ....services.composio_service import composio_service

router = APIRouter()


@router.get("/dashboard", response_model=IntegrationDashboard)
async def get_integration_dashboard(
    current_user: dict = Depends(get_current_user)
):
    """
    Get complete integration dashboard for the current user.
    
    Returns comprehensive information about all available integrations,
    their connection status, health, and capabilities.
    """
    try:
        user_id = current_user["user_id"]
        dashboard = await integration_service.get_integration_dashboard(user_id)
        return dashboard
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get integration dashboard: {str(e)}"
        )


@router.get("/stats", response_model=IntegrationStats)
async def get_integration_stats(
    current_user: dict = Depends(get_current_user)
):
    """
    Get integration statistics and analytics for the current user.
    
    Returns aggregated statistics about integrations, categories,
    and connection trends for dashboard analytics.
    """
    try:
        user_id = current_user["user_id"]
        stats = await integration_service.get_integration_stats(user_id)
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get integration statistics: {str(e)}"
        )


@router.get("/summary", response_model=List[IntegrationSummary])
async def get_integration_summary(
    category: Optional[str] = Query(None, description="Filter by category"),
    connected_only: bool = Query(False, description="Show only connected integrations"),
    search: Optional[str] = Query(None, description="Search by provider name"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get a filtered list of integration summaries.
    
    Supports filtering by category, connection status, and search terms.
    Useful for building custom integration lists and search functionality.
    """
    try:
        user_id = current_user["user_id"]
        dashboard = await integration_service.get_integration_dashboard(user_id)
        
        integrations = dashboard.integrations
        
        # Apply filters
        if category:
            integrations = [
                i for i in integrations 
                if category.lower() in [c.lower() for c in i.categories]
            ]
        
        if connected_only:
            integrations = [i for i in integrations if i.total_connections > 0]
        
        if search:
            search_lower = search.lower()
            integrations = [
                i for i in integrations
                if search_lower in i.provider.lower() or 
                   search_lower in i.display_name.lower() or
                   search_lower in (i.description or '').lower()
            ]
        
        return integrations
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get integration summary: {str(e)}"
        )


@router.get("/{provider}/details", response_model=IntegrationSummary)
async def get_integration_details(
    provider: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed information about a specific integration provider.
    
    Returns comprehensive details including all connections, available actions,
    auth configurations, and health status for the specified provider.
    """
    try:
        user_id = current_user["user_id"]
        dashboard = await integration_service.get_integration_dashboard(user_id)
        
        # Find the specific integration
        integration = next(
            (i for i in dashboard.integrations if i.provider.lower() == provider.lower()),
            None
        )
        
        if not integration:
            raise HTTPException(
                status_code=404,
                detail=f"Integration '{provider}' not found"
            )
        
        return integration
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get integration details: {str(e)}"
        )


@router.post("/action", response_model=IntegrationActionResponse)
async def perform_integration_action(
    action_request: IntegrationActionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Perform an action on an integration (connect, disconnect, refresh, etc.).
    
    Supports various actions:
    - connect: Initiate new connection
    - disconnect: Remove existing connection
    - refresh: Refresh connection credentials
    - enable/disable: Change connection status
    """
    try:
        user_id = current_user["user_id"]
        provider = action_request.provider
        action = action_request.action.lower()
        
        if not composio_service.initialized:
            raise HTTPException(
                status_code=503,
                detail="Composio service not available"
            )
        
        if action == "connect":
            # Initiate new connection
            result = await composio_service.enhanced_initiate_connection(
                user_id=user_id,
                app_name=provider,
                auth_config_id=action_request.auth_config_id,
                redirect_url=action_request.parameters.get('redirect_url') if action_request.parameters else None
            )
            
            return IntegrationActionResponse(
                success=True,
                message=f"Connection initiated for {provider}",
                redirect_url=result.get("redirect_url"),
                connection_id=result.get("connection_id"),
                data=result
            )
        
        elif action == "disconnect":
            if not action_request.connection_id:
                raise ValidationError("Connection ID required for disconnect action")
            
            success = await composio_service.delete_connected_account(action_request.connection_id)
            
            return IntegrationActionResponse(
                success=success,
                message=f"Successfully disconnected {provider}" if success else f"Failed to disconnect {provider}"
            )
        
        elif action == "refresh":
            if not action_request.connection_id:
                raise ValidationError("Connection ID required for refresh action")
            
            success = await composio_service.refresh_connected_account(action_request.connection_id)
            
            return IntegrationActionResponse(
                success=success,
                message=f"Successfully refreshed {provider}" if success else f"Failed to refresh {provider}"
            )
        
        elif action == "enable":
            if not action_request.connection_id:
                raise ValidationError("Connection ID required for enable action")
            
            success = await composio_service.enable_connected_account(action_request.connection_id)
            
            return IntegrationActionResponse(
                success=success,
                message=f"Successfully enabled {provider}" if success else f"Failed to enable {provider}"
            )
        
        elif action == "disable":
            if not action_request.connection_id:
                raise ValidationError("Connection ID required for disable action")
            
            success = await composio_service.disable_connected_account(action_request.connection_id)
            
            return IntegrationActionResponse(
                success=success,
                message=f"Successfully disabled {provider}" if success else f"Failed to disable {provider}"
            )
        
        else:
            raise ValidationError(f"Unknown action: {action}")
    
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ComposioError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to perform action '{action}' on {provider}: {str(e)}"
        )


@router.get("/categories")
async def get_integration_categories(
    current_user: dict = Depends(get_current_user)
):
    """
    Get all available integration categories with counts.
    
    Returns a list of categories showing how many services are available
    and how many are currently connected for each category.
    """
    try:
        user_id = current_user["user_id"]
        stats = await integration_service.get_integration_stats(user_id)
        return {
            "categories": stats.categories,
            "total_categories": len(stats.categories)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get integration categories: {str(e)}"
        )


@router.get("/health")
async def get_integration_health(
    current_user: dict = Depends(get_current_user)
):
    """
    Get overall integration system health status.
    
    Returns health information about the integration system,
    including Composio service status and connection health summary.
    """
    try:
        user_id = current_user["user_id"]
        dashboard = await integration_service.get_integration_dashboard(user_id)
        
        # Calculate health metrics
        total_connections = dashboard.total_connections
        healthy_connections = dashboard.healthy_connections
        failed_connections = sum(i.error_connections for i in dashboard.integrations)
        
        health_percentage = (healthy_connections / total_connections * 100) if total_connections > 0 else 100
        
        return {
            "composio_health": dashboard.composio_health,
            "total_connections": total_connections,
            "healthy_connections": healthy_connections,
            "failed_connections": failed_connections,
            "health_percentage": round(health_percentage, 1),
            "status": "healthy" if health_percentage >= 80 else "warning" if health_percentage >= 60 else "critical",
            "last_updated": dashboard.last_updated
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get integration health: {str(e)}"
        )
