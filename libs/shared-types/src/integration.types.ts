// Integration-related types for Kronos Chat

export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: 'available' | 'coming_soon' | 'beta';
  capabilities: string[];
  authType: 'oauth' | 'api_key' | 'webhook';
  isConnected?: boolean;
  connectedAt?: string;
}

export interface IntegrationStatus {
  configured: boolean;
  integrations: Integration[];
}

export interface ConnectIntegrationRequest {
  provider: string;
}

export interface ConnectIntegrationResponse {
  success: boolean;
  message?: string;
  authUrl?: string;
  provider: string;
  status: 'available' | 'coming_soon' | 'beta';
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
  icon: string;
  category: string;
  status: 'available' | 'coming_soon' | 'beta';
  capabilities: string[];
  authType: 'oauth' | 'api_key' | 'webhook';
  documentation?: string;
  setupInstructions?: string[];
}
