// Integration-related types for Kronos Chat

export enum IntegrationStatusType {
  AVAILABLE = 'available',
  COMING_SOON = 'coming_soon',
  BETA = 'beta',
}

export enum AuthType {
  OAUTH = 'oauth',
  API_KEY = 'api_key',
  WEBHOOK = 'webhook',
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  status: IntegrationStatusType;
  capabilities: string[];
  authType: AuthType;
  isConnected?: boolean;
  connectedAt?: string;
}


export interface ConnectIntegrationRequest {
  provider: string;
}

export interface ConnectIntegrationResponse {
  success: boolean;
  message?: string;
  authUrl?: string;
  provider: string;
  status: IntegrationStatusType;
  connectionId?: string;
}

export interface DisconnectIntegrationRequest {
  provider: string;
}

export interface DisconnectIntegrationResponse {
  success: boolean;
  message?: string;
}

export interface IntegrationDetails {
  id: string;
  name: string;
  description: string;
  category: string;
  status: IntegrationStatusType;
  capabilities: string[];
  authType: AuthType;
  documentation?: string;
  setupInstructions?: string[];
}
