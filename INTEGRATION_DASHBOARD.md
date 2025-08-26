# Integration Dashboard Documentation

## Overview

The Integration Dashboard provides a comprehensive view of all third-party integrations and their status within the Kronos Chat application. It's built on top of the existing Composio infrastructure to give users complete visibility and control over their OAuth connections.

## Features

### 🎯 Main Dashboard
- **System Health Overview**: Real-time health status of the integration system
- **Quick Statistics**: Total integrations, connected services, active connections, and health metrics
- **Integration Grid**: Visual cards showing all available integrations with their status
- **Smart Filtering**: Filter by category, search by name, or show only connected integrations

### 📊 Key Metrics
- **Total Available Services**: Number of integrations available through Composio
- **Connected Services**: Services with at least one active connection
- **Total Connections**: Sum of all individual OAuth connections
- **Healthy Connections**: Number of working connections without errors

### 🔍 Integration Details
Each integration card shows:
- **Service Logo & Name**: Visual identification with proper branding
- **Health Status**: Visual indicators (✅ Healthy, ⚠️ Warning, ❌ Error, ⚪ Unknown)
- **Connection Statistics**: Total, active, and error connection counts
- **Categories**: Service categorization (e.g., Communication, Productivity, Development)
- **Quick Actions**: Connect, manage, refresh, or disconnect functionality

### 🎨 User Interface Features
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Automatic refresh after connection actions
- **Smart Categorization**: Organized by service types (Email, Communication, CRM, etc.)
- **Search & Filters**: Find integrations quickly with smart filtering
- **Modal Management**: Detailed connection management in modal dialogs

## Backend Architecture

### Models & Schemas (`/server/app/schemas/integration.py`)
- `IntegrationSummary`: Complete service information with health and connections
- `IntegrationDashboard`: Aggregated dashboard data
- `IntegrationConnection`: Individual OAuth connection details
- `IntegrationStats`: Analytics and statistics data
- `IntegrationCategory`: Service categorization with counts

### Service Layer (`/server/app/services/integration_service.py`)
- `IntegrationService`: Core business logic for aggregating integration data
- Health status calculation based on connection states
- Service categorization and normalization
- Statistics computation and trending

### API Endpoints (`/server/app/api/v1/endpoints/integrations.py`)
- `GET /integrations/dashboard` - Complete dashboard data
- `GET /integrations/stats` - Statistics and analytics
- `GET /integrations/summary` - Filtered integration list
- `GET /integrations/{provider}/details` - Specific integration details
- `POST /integrations/action` - Perform integration actions
- `GET /integrations/categories` - Available categories
- `GET /integrations/health` - System health status

## Frontend Components

### Main Component (`/client/src/components/IntegrationDashboard.tsx`)
- **React functional component** with hooks for state management
- **Real-time data loading** from multiple API endpoints
- **Interactive filtering** and search functionality
- **Action handling** for connect/disconnect/refresh operations
- **Modal system** for detailed connection management

### API Integration (`/client/src/services/apiService.ts`)
- Extended API service with integration-specific methods
- Type-safe interfaces for all integration data structures
- Error handling and loading states
- Automatic token management for authenticated requests

## Integration Categories

The system automatically categorizes services into logical groups:

- **Communication**: Slack, Discord, Teams, Zoom
- **Email**: Gmail, Outlook
- **Productivity**: Notion, Airtable, Trello, Asana
- **Development**: GitHub, GitLab, Figma, Linear
- **Google Workspace**: Google Sheets, Drive, Calendar
- **CRM & Sales**: HubSpot, Salesforce
- **Support**: Zendesk, Intercom
- **Payment**: Stripe, PayPal
- **Storage**: Dropbox, OneDrive

## Health Status System

### Health Calculation Logic
- **Healthy** ✅: All connections are active and working
- **Warning** ⚠️: Some connections inactive or mixed status
- **Error** ❌: Majority of connections have errors
- **Unknown** ⚪: No connections established

### Connection States
- **Active**: Working OAuth connection
- **Inactive**: Disabled or disconnected
- **Pending**: OAuth flow in progress
- **Error**: Connection failed or expired
- **Disabled**: Manually disabled by user

## Security Features

- **JWT Authentication**: All endpoints require valid authentication
- **User Isolation**: Users only see their own connections
- **Secure Token Storage**: OAuth tokens managed by Composio
- **HTTPS Enforcement**: All OAuth redirects use secure protocols

## Usage Examples

### Viewing Dashboard
1. Navigate to the "Integration Dashboard" tab
2. View system health and quick statistics
3. Browse available integrations in the grid layout
4. Use filters to find specific services

### Connecting a New Service
1. Find the desired service in the dashboard
2. Click the "Connect" button
3. Follow the OAuth flow in the popup window
4. Return to see the updated connection status

### Managing Existing Connections
1. Click "Manage Connections" on a connected service
2. View all individual connections in the modal
3. Remove or refresh specific connections
4. Monitor health status and error messages

### Troubleshooting Issues
1. Check the system health indicator at the top
2. Look for services with error status (❌)
3. Click on error connections to see detailed error messages
4. Use the refresh action to retry failed connections

## API Usage Examples

### Get Dashboard Data
```javascript
const dashboard = await apiService.getIntegrationDashboard();
console.log(`${dashboard.connected_integrations} services connected`);
```

### Filter Integrations
```javascript
const communicationApps = await apiService.getIntegrationSummary({
  category: 'Communication',
  connected_only: true
});
```

### Connect New Service
```javascript
const response = await apiService.performIntegrationAction({
  provider: 'slack',
  action: 'connect',
  parameters: { redirect_url: 'https://app.example.com/oauth/callback' }
});

if (response.redirect_url) {
  window.location.href = response.redirect_url;
}
```

## Performance Considerations

- **Caching**: Dashboard data is cached on the frontend
- **Lazy Loading**: Integration details loaded on-demand
- **Batch Operations**: Multiple API calls are batched when possible
- **Optimistic Updates**: UI updates immediately for better UX

## Future Enhancements

- **Analytics Charts**: Visual trends and usage analytics
- **Webhook Management**: Configure integration webhooks
- **Bulk Operations**: Connect/disconnect multiple services at once
- **Custom Categories**: User-defined service categorization
- **Integration Recommendations**: Suggest relevant integrations
- **Usage Metrics**: Track integration usage and performance

## Configuration

### Environment Variables
```env
COMPOSIO_API_KEY=your_composio_api_key
COMPOSIO_BASE_URL=https://backend.composio.dev
```

### Frontend Configuration
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
```

## Troubleshooting

### Common Issues
1. **"Composio service not available"**: Check COMPOSIO_API_KEY configuration
2. **"Failed to load integrations"**: Verify API connectivity
3. **"OAuth redirect failed"**: Check redirect URL configuration
4. **"Connection health unknown"**: Wait for connection status to update

### Debug Information
- Check browser console for detailed error messages
- Verify authentication token is valid
- Ensure Composio service is properly initialized
- Check API endpoint responses in browser network tab
