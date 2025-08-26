# Composio Server Integration

This document explains the server-side implementation of the Composio OAuth integration for the Kronos Chat application.

## Architecture

The server-side integration consists of:

1. **Configuration** - Environment-based configuration for Composio
2. **Service Layer** - Core business logic for interacting with Composio
3. **API Routes** - RESTful endpoints for client-server communication
4. **Background Tasks** - Asynchronous operations for handling OAuth callbacks

## Components

### 1. Configuration (`app/config/composio.py`)

Handles environment variable configuration for Composio:
- API key management
- Base URL configuration
- Timeout settings
- Provider definitions

### 2. Service Layer (`app/services/composio_service.py`)

A singleton service that encapsulates all Composio operations:
- Client initialization and management
- OAuth connection handling
- Connected account management
- Tool execution

### 3. API Routes (`app/routes/composio.py`)

RESTful endpoints for:
- Health checks
- Connection initiation
- Account management (list, get, enable, disable, refresh, delete)
- Tool execution

## API Endpoints

### Health Check
```
GET /api/v1/composio/health
```

### Initiate Connection
```
POST /api/v1/composio/connections/initiate
{
  "user_id": "user123",
  "provider": "github",
  "callback_url": "https://example.com/oauth/callback",
  "scope": ["repo", "user"]
}
```

### List Connections
```
GET /api/v1/composio/connections/{user_id}
```

### Get Connection
```
GET /api/v1/composio/connections/account/{account_id}
```

### Manage Connection
```
POST /api/v1/composio/connections/{account_id}/enable
POST /api/v1/composio/connections/{account_id}/disable
POST /api/v1/composio/connections/{account_id}/refresh
DELETE /api/v1/composio/connections/{account_id}
```

### Execute Tool
```
POST /api/v1/composio/tools/execute
{
  "user_id": "user123",
  "action_name": "GITHUB_STAR_A_REPOSITORY_FOR_THE_AUTHENTICATED_USER",
  "params": {
    "owner": "ComposioHQ",
    "repo": "composio"
  },
  "connected_account_id": "optional_account_id"
}
```

## Setup

1. Add the Composio dependency to `requirements.txt`:
   ```
   composio-core>=0.5.0,<1.0.0
   ```

2. Set environment variables:
   ```
   COMPOSIO_API_KEY=your_composio_api_key_here
   ```

3. The service automatically initializes when the application starts

## Error Handling

All endpoints include proper error handling:
- HTTP 400 for client errors (invalid parameters, missing API key)
- HTTP 500 for server errors (Composio API issues, network problems)
- Detailed error messages for debugging

## Background Processing

Connection completion is handled asynchronously using FastAPI background tasks to avoid blocking the client while waiting for OAuth completion.

## Security

- API keys are stored in environment variables, not in code
- All endpoints validate input parameters
- Connection credentials are managed securely by Composio