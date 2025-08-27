"""
Integration service for managing and aggregating integration data.
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict

from ..schemas.integration import (
    IntegrationSummary, IntegrationDashboard, IntegrationConnection,
    IntegrationStatus, ConnectionHealth, IntegrationCategory, IntegrationStats
)
from ..services.composio_service import composio_service

logger = logging.getLogger("kronos.services.integration")



class IntegrationService:
    """Service for integration dashboard and management."""
    
    def __init__(self):
        self.composio = composio_service
    
    def _get_health_status(self, connections: List[IntegrationConnection]) -> ConnectionHealth:
        """Determine overall health status based on connections."""
        if not connections:
            return ConnectionHealth.UNKNOWN
        
        active_count = sum(1 for c in connections if c.status == IntegrationStatus.ACTIVE)
        error_count = sum(1 for c in connections if c.status == IntegrationStatus.ERROR)
        total_count = len(connections)
        
        if error_count > 0:
            error_ratio = error_count / total_count
            if error_ratio > 0.5:
                return ConnectionHealth.ERROR
            else:
                return ConnectionHealth.WARNING
        elif active_count > 0:
            return ConnectionHealth.HEALTHY
        else:
            return ConnectionHealth.WARNING
    
    def _get_health_message(self, health: ConnectionHealth, connections: List[IntegrationConnection]) -> str:
        """Get health status message."""
        total = len(connections)
        active = sum(1 for c in connections if c.status == IntegrationStatus.ACTIVE)
        errors = sum(1 for c in connections if c.status == IntegrationStatus.ERROR)
        
        if health == ConnectionHealth.HEALTHY:
            return f"All {active} connections are healthy"
        elif health == ConnectionHealth.WARNING:
            if active == 0:
                return f"No active connections out of {total}"
            else:
                return f"{active} active, {errors} with issues"
        elif health == ConnectionHealth.ERROR:
            return f"{errors} connections have errors"
        else:
            return "No connections established"
    
    def _normalize_provider_name(self, provider: str) -> str:
        """Normalize provider name for display."""
        # Handle common provider name variations
        name_mapping = {
            'gmail': 'Gmail',
            'googlesheets': 'Google Sheets',
            'googledrive': 'Google Drive',
            'googlecalendar': 'Google Calendar',
            'slack': 'Slack',
            'discord': 'Discord',
            'github': 'GitHub',
            'gitlab': 'GitLab',
            'trello': 'Trello',
            'asana': 'Asana',
            'notion': 'Notion',
            'hubspot': 'HubSpot',
            'salesforce': 'Salesforce',
            'zendesk': 'Zendesk',
            'intercom': 'Intercom',
            'stripe': 'Stripe',
            'paypal': 'PayPal',
            'dropbox': 'Dropbox',
            'onedrive': 'OneDrive',
            'zoom': 'Zoom',
            'teams': 'Microsoft Teams',
            'linear': 'Linear',
            'figma': 'Figma',
            'airtable': 'Airtable',
        }
        return name_mapping.get(provider.lower(), provider.title())
    
    def _categorize_service(self, provider: str, categories: List[str]) -> List[str]:
        """Categorize a service based on provider name and existing categories."""
        # If categories are provided by Composio, use them
        if categories:
            return categories
        
        # Fallback categorization based on provider name
        category_mapping = {
            # Communication
            'slack': ['Communication', 'Team Collaboration'],
            'discord': ['Communication', 'Gaming'],
            'teams': ['Communication', 'Microsoft', 'Video Conferencing'],
            'zoom': ['Communication', 'Video Conferencing'],
            
            # Email
            'gmail': ['Email', 'Google', 'Communication'],
            'outlook': ['Email', 'Microsoft', 'Communication'],
            
            # Productivity
            'notion': ['Productivity', 'Note Taking', 'Collaboration'],
            'airtable': ['Productivity', 'Database', 'Collaboration'],
            'trello': ['Productivity', 'Project Management'],
            'asana': ['Productivity', 'Project Management'],
            'linear': ['Productivity', 'Project Management', 'Development'],
            
            # Development
            'github': ['Development', 'Version Control', 'Code'],
            'gitlab': ['Development', 'Version Control', 'Code'],
            'figma': ['Development', 'Design', 'Collaboration'],
            
            # Google Workspace
            'googlesheets': ['Google', 'Spreadsheet', 'Productivity'],
            'googledrive': ['Google', 'Storage', 'File Management'],
            'googlecalendar': ['Google', 'Calendar', 'Scheduling'],
            
            # CRM & Sales
            'hubspot': ['CRM', 'Sales', 'Marketing'],
            'salesforce': ['CRM', 'Sales', 'Enterprise'],
            
            # Support
            'zendesk': ['Support', 'Customer Service'],
            'intercom': ['Support', 'Customer Service', 'Communication'],
            
            # Payment
            'stripe': ['Payment', 'Financial', 'E-commerce'],
            'paypal': ['Payment', 'Financial', 'E-commerce'],
            
            # Storage
            'dropbox': ['Storage', 'File Management'],
            'onedrive': ['Storage', 'File Management', 'Microsoft'],
        }
        
        return category_mapping.get(provider.lower(), ['Other'])
    
    async def get_integration_dashboard(self, user_id: str) -> IntegrationDashboard:
        """Get complete integration dashboard for a user."""
        try:
            if not self.composio.initialized:
                logger.warning("Composio service not initialized")
                return IntegrationDashboard(
                    user_id=user_id,
                    composio_health=False,
                    integrations=[]
                )
            
            # Get all available toolkits
            try:
                toolkits = await self.composio.get_available_toolkits(limit=100)
            except Exception as e:
                logger.error(f"Failed to get toolkits: {e}")
                toolkits = []
            
            # Get user's connections
            try:
                connections = await self.composio.list_connected_accounts(user_id)
            except Exception as e:
                logger.error(f"Failed to get connections for user {user_id}: {e}")
                connections = []
            
            # Group connections by provider
            connections_by_provider = defaultdict(list)
            for conn in connections:
                provider = conn.get('provider', '').lower()
                connections_by_provider[provider].append(conn)
            
            # Create integration summaries
            integrations = []
            all_categories = set()
            
            for toolkit in toolkits:
                provider = toolkit.get('slug', '')
                if not provider:
                    continue
                
                # Get connections for this provider
                provider_connections = connections_by_provider.get(provider.lower(), [])
                
                # Convert to IntegrationConnection objects
                integration_connections = []
                for conn in provider_connections:
                    status = self._parse_connection_status(conn.get('status', ''))
                    integration_connections.append(IntegrationConnection(
                        account_id=conn.get('account_id', ''),
                        status=status,
                        created_at=self._parse_datetime(conn.get('created_at')),
                        error_message=conn.get('error') if status == IntegrationStatus.ERROR else None
                    ))
                
                # Calculate stats
                total_conns = len(integration_connections)
                active_conns = sum(1 for c in integration_connections if c.status == IntegrationStatus.ACTIVE)
                inactive_conns = sum(1 for c in integration_connections if c.status == IntegrationStatus.INACTIVE)
                error_conns = sum(1 for c in integration_connections if c.status == IntegrationStatus.ERROR)
                
                # Determine health
                health = self._get_health_status(integration_connections)
                health_message = self._get_health_message(health, integration_connections)
                
                # Get categories
                categories = self._categorize_service(provider, toolkit.get('categories', []))
                all_categories.update(categories)
                
                # Get available actions count
                try:
                    actions = await self.composio.get_toolkit_actions(provider, limit=10)
                    available_actions = len(actions)
                except Exception:
                    available_actions = 0
                
                # Create integration summary
                integration = IntegrationSummary(
                    provider=provider,
                    display_name=self._normalize_provider_name(provider),
                    description=toolkit.get('description', ''),
                    logo_url=toolkit.get('logo', ''),
                    categories=categories,
                    total_connections=total_conns,
                    active_connections=active_conns,
                    inactive_connections=inactive_conns,
                    error_connections=error_conns,
                    health=health,
                    health_message=health_message,
                    auth_schemes=toolkit.get('auth_schemes', []),
                    available_actions=available_actions,
                    connections=integration_connections
                )
                
                integrations.append(integration)
            
            # Sort integrations: connected first, then by name
            integrations.sort(key=lambda x: (-x.total_connections, x.display_name))
            
            # Calculate dashboard stats
            total_integrations = len(integrations)
            connected_integrations = sum(1 for i in integrations if i.total_connections > 0)
            total_connections = sum(i.total_connections for i in integrations)
            healthy_connections = sum(i.active_connections for i in integrations)
            
            # Get popular integrations (most connected)
            popular = sorted(
                [i for i in integrations if i.total_connections > 0],
                key=lambda x: x.total_connections,
                reverse=True
            )[:5]
            popular_integrations = [i.provider for i in popular]
            
            return IntegrationDashboard(
                user_id=user_id,
                total_integrations=total_integrations,
                connected_integrations=connected_integrations,
                total_connections=total_connections,
                healthy_connections=healthy_connections,
                categories=sorted(list(all_categories)),
                popular_integrations=popular_integrations,
                integrations=integrations,
                composio_health=True,
                last_updated=datetime.utcnow()
            )
            
        except Exception as e:
            logger.error(f"Failed to get integration dashboard: {e}")
            return IntegrationDashboard(
                user_id=user_id,
                composio_health=False,
                integrations=[]
            )           
    
    async def get_integration_stats(self, user_id: str) -> IntegrationStats:
        """Get integration statistics for analytics."""
        dashboard = await self.get_integration_dashboard(user_id)
        
        # Group by categories
        category_stats = defaultdict(lambda: {'services': set(), 'connected': 0})
        
        for integration in dashboard.integrations:
            for category in integration.categories:
                category_stats[category]['services'].add(integration.provider)
                if integration.total_connections > 0:
                    category_stats[category]['connected'] += 1
        
        # Create category objects
        categories = []
        for cat_name, stats in category_stats.items():
            categories.append(IntegrationCategory(
                name=cat_name.lower().replace(' ', '_'),
                display_name=cat_name,
                service_count=len(stats['services']),
                connected_count=stats['connected'],
                services=list(stats['services'])
            ))
        
        categories.sort(key=lambda x: x.connected_count, reverse=True)
        
        return IntegrationStats(
            total_available=dashboard.total_integrations,
            total_connected=dashboard.connected_integrations,
            total_connections=dashboard.total_connections,
            active_connections=dashboard.healthy_connections,
            failed_connections=sum(i.error_connections for i in dashboard.integrations),
            categories=categories
        )
    
    def _parse_connection_status(self, status: str) -> IntegrationStatus:
        """Parse connection status string to enum."""
        status_lower = status.lower()
        if status_lower in ['active', 'enabled', 'connected']:
            return IntegrationStatus.ACTIVE
        elif status_lower in ['inactive', 'disabled', 'disconnected']:
            return IntegrationStatus.INACTIVE
        elif status_lower in ['pending', 'initiated']:
            return IntegrationStatus.PENDING
        elif status_lower in ['error', 'failed']:
            return IntegrationStatus.ERROR
        else:
            return IntegrationStatus.INACTIVE
    
    def _parse_datetime(self, dt_string: Optional[str]) -> Optional[datetime]:
        """Parse datetime string safely."""
        if not dt_string:
            return None
        try:
            # Try different datetime formats
            for fmt in ['%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%dT%H:%M:%SZ', '%Y-%m-%d %H:%M:%S']:
                try:
                    return datetime.strptime(dt_string, fmt)
                except ValueError:
                    continue
            return None
        except Exception:
            return None


# Create singleton instance
integration_service = IntegrationService()
