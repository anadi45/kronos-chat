# Composio OAuth Integration

This document explains how to set up and use OAuth integrations with Composio in the Kronos Chat application.

## Prerequisites

1. Sign up for a Composio account at [https://www.composio.dev/](https://www.composio.dev/)
2. Obtain your Composio API key from the dashboard
3. Install the required dependencies (already done in this project)

## Setup

1. Add your Composio API key to your environment variables:
   ```
   VITE_COMPOSIO_API_KEY=your_composio_api_key_here
   ```

2. The integration is already configured in `src/config/composio.ts`

## How It Works

The Composio integration provides:

1. **OAuth Connection Management** - Connect to third-party services like GitHub, Slack, Notion, etc.
2. **Tool Execution** - Execute actions on connected services
3. **Connection Status Monitoring** - Track the status of your connections

## Components

### 1. ComposioService (`src/services/composioService.ts`)

A service that handles all interactions with the Composio API:

- Initialize the Composio client
- Initiate OAuth connections
- Manage connected accounts
- Execute tools/actions

### 2. OAuthIntegrationManager (`src/components/OAuthIntegrationManager.tsx`)

A React component that provides a UI for:

- Connecting to OAuth providers
- Viewing connected accounts
- Refreshing connections
- Disconnecting accounts

### 3. OAuthCallback (`src/components/OAuthCallback.tsx`)

Handles the OAuth callback after a user authenticates with a third-party service.

### 4. ToolExecutor (`src/components/ToolExecutor.tsx`)

A component for testing tool execution with connected services.

## Supported Providers

The integration supports the following providers:

- GitHub
- Slack
- Notion
- Gmail
- Google Calendar
- Twitter
- Discord

## Usage

### 1. Connecting a Service

1. Navigate to the integrations page
2. Select a service from the dropdown
3. Click "Connect"
4. You'll be redirected to the provider's OAuth page
5. After authentication, you'll be redirected back to the callback URL
6. The connection will be established automatically

### 2. Executing Tools

Once connected, you can execute tools on the connected services:

1. Use the ToolExecutor component or call the service directly
2. Specify the action name and parameters
3. The service will execute the action using your connected account

### 3. Managing Connections

You can view, refresh, and disconnect accounts from the integration manager.

## Security

- API keys are stored in environment variables, not in the code
- OAuth flows are handled securely by Composio
- Connection credentials are managed by Composio and never exposed to the client

## Error Handling

The integration includes comprehensive error handling for:

- Missing API keys
- Failed connections
- Expired credentials
- Network issues
- Invalid parameters

## Customization

To add new providers or customize scopes:

1. Update the `PROVIDERS` object in `src/config/composio.ts`
2. Modify the `getProviderScopes` function in `OAuthIntegrationManager.tsx`
3. Add any provider-specific logic as needed

## Troubleshooting

### "API Key Missing" Error

Make sure you've set the `VITE_COMPOSIO_API_KEY` environment variable.

### "Connection Failed" Error

1. Check that your API key is valid
2. Verify the provider supports the requested scopes
3. Ensure the callback URL is correctly configured

### "Tool Execution Failed" Error

1. Verify the connection is active
2. Check that the action name is correct
3. Ensure the parameters match the action requirements