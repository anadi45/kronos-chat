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

export enum Provider {
  GMAIL = 'GMAIL',
  GITHUB = 'GITHUB'
}

export interface Integration {
  id: Provider;
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
  provider: Provider;
}

export interface ConnectIntegrationResponse {
  success: boolean;
  message?: string;
  authUrl?: string;
  provider: Provider;
  status: IntegrationStatusType;
  connectionId?: string;
}

export interface DisconnectIntegrationRequest {
  provider: Provider;
}

export interface DisconnectIntegrationResponse {
  success: boolean;
  message?: string;
}

export interface IntegrationDetails {
  id: Provider;
  name: string;
  description: string;
  category: string;
  status: IntegrationStatusType;
  capabilities: string[];
  authType: AuthType;
  documentation?: string;
  setupInstructions?: string[];
}
