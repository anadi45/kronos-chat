"""
Schemas for integration dashboard and status management.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class IntegrationStatus(str, Enum):
    """Integration status enumeration."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    ERROR = "error"
    DISABLED = "disabled"


class ConnectionHealth(str, Enum):
    """Connection health status."""
    HEALTHY = "healthy"
    WARNING = "warning"
    ERROR = "error"
    UNKNOWN = "unknown"


class IntegrationConnection(BaseModel):
    """Individual connection within an integration."""
    account_id: str
    status: IntegrationStatus
    created_at: Optional[datetime] = None
    last_used: Optional[datetime] = None
    error_message: Optional[str] = None


class IntegrationSummary(BaseModel):
    """Summary of a single integration service."""
    provider: str = Field(..., description="Provider/service name (e.g., 'gmail', 'slack')")
    display_name: str = Field(..., description="Human-readable service name")
    description: Optional[str] = Field(None, description="Service description")
    logo_url: Optional[str] = Field(None, description="Service logo URL")
    categories: List[str] = Field(default_factory=list, description="Service categories")
    
    # Connection status
    total_connections: int = Field(0, description="Total number of connections")
    active_connections: int = Field(0, description="Number of active connections")
    inactive_connections: int = Field(0, description="Number of inactive connections")
    error_connections: int = Field(0, description="Number of connections with errors")
    
    # Health status
    health: ConnectionHealth = Field(ConnectionHealth.UNKNOWN, description="Overall health status")
    health_message: Optional[str] = Field(None, description="Health status message")
    
    # Configuration
    has_auth_config: bool = Field(False, description="Whether custom auth config exists")
    auth_schemes: List[str] = Field(default_factory=list, description="Supported auth schemes")
    
    # Capabilities
    available_actions: int = Field(0, description="Number of available actions")
    last_connection_attempt: Optional[datetime] = Field(None, description="Last connection attempt")
    
    # Connection details
    connections: List[IntegrationConnection] = Field(default_factory=list, description="Individual connections")


class IntegrationDashboard(BaseModel):
    """Complete integration dashboard data."""
    user_id: str
    total_integrations: int = Field(0, description="Total number of available integrations")
    connected_integrations: int = Field(0, description="Number of integrations with at least one connection")
    total_connections: int = Field(0, description="Total number of active connections")
    healthy_connections: int = Field(0, description="Number of healthy connections")
    
    # Summary stats
    categories: List[str] = Field(default_factory=list, description="Available service categories")
    popular_integrations: List[str] = Field(default_factory=list, description="Most popular integrations")
    
    # Individual integration data
    integrations: List[IntegrationSummary] = Field(default_factory=list, description="All integration summaries")
    
    # System health
    composio_health: bool = Field(False, description="Composio service health")
    last_updated: datetime = Field(default_factory=datetime.utcnow, description="Last dashboard update")


class IntegrationActionRequest(BaseModel):
    """Request to perform an action on an integration."""
    provider: str = Field(..., description="Provider/service name")
    action: str = Field(..., description="Action to perform (connect, disconnect, refresh, etc.)")
    connection_id: Optional[str] = Field(None, description="Specific connection ID (for connection-specific actions)")
    auth_config_id: Optional[str] = Field(None, description="Auth config ID for new connections")
    parameters: Optional[Dict[str, Any]] = Field(None, description="Additional action parameters")


class IntegrationActionResponse(BaseModel):
    """Response from integration action."""
    success: bool
    message: str
    redirect_url: Optional[str] = None
    connection_id: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class IntegrationCategory(BaseModel):
    """Integration category with services."""
    name: str
    display_name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    service_count: int = 0
    connected_count: int = 0
    services: List[str] = Field(default_factory=list)


class IntegrationStats(BaseModel):
    """Integration statistics."""
    total_available: int = 0
    total_connected: int = 0
    total_connections: int = 0
    active_connections: int = 0
    failed_connections: int = 0
    categories: List[IntegrationCategory] = Field(default_factory=list)
    connection_trend: List[Dict[str, Any]] = Field(default_factory=list)  # For charts/graphs
