export interface ConnectedAccount {
  accountId: string;
  status: string;
  provider: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConnectionRequest {
  connectionId: string;
  redirectUrl: string;
  status: string;
}

export interface AuthConfig {
  id: string;
  uuid: string;
  name: string;
  type: string;
  toolkit: {
    slug: string;
    name?: string;
    logo?: string;
  };
  status: string;
  noOfConnections: number;
  authScheme: string;
  isComposioManaged: boolean;
  createdAt?: string;
  lastUpdatedAt?: string;
}

export interface AuthConfigRequest {
  name: string;
  toolkitSlug: string;
  authScheme?: string;
  credentials?: Record<string, unknown>;
  proxyConfig?: Record<string, unknown>;
}

export interface AuthConfigUpdateRequest {
  name?: string;
  credentials?: Record<string, unknown>;
  proxyConfig?: Record<string, unknown>;
}

export interface AuthConfigListResponse {
  items: AuthConfig[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
  nextCursor?: string;
}

export interface Toolkit {
  slug: string;
  name: string;
  description: string;
  logo: string;
  categories: string[];
  authSchemes: string[];
}

export interface ToolkitAction {
  name: string;
  displayName: string;
  description: string;
  parameters: any;
  response: any;
  appName: string;
}

export interface InitiateConnectionDto {
  provider: string;
  callbackUrl?: string;
  scope?: string[];
}

export interface EnhancedConnectionRequest {
  userId: string;
  appName: string;
  authConfigId?: string;
  redirectUrl?: string;
  labels?: string[];
}

export interface ConnectionResponse {
  connectionId: string;
  redirectUrl: string;
  status: string;
}

export interface ExecuteToolDto {
  actionName: string;
  params?: Record<string, any>;
  connectedAccountId?: string;
}

export interface ToolExecuteRequest {
  userId: string;
  actionName: string;
  params: Record<string, unknown>;
  connectedAccountId?: string;
}

export interface ToolExecuteResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

// Integration Dashboard types
export interface IntegrationConnection {
  accountId: string;
  status: 'active' | 'inactive' | 'pending' | 'error' | 'disabled';
  createdAt: string;
  lastUsed: string;
  errorMessage?: string;
}

export interface IntegrationSummary {
  provider: string;
  displayName: string;
  description?: string;
  logoUrl?: string;
  categories: string[];
  totalConnections: number;
  activeConnections: number;
  inactiveConnections: number;
  errorConnections: number;
  health: 'healthy' | 'warning' | 'error' | 'unknown';
  healthMessage?: string;
  hasAuthConfig: boolean;
  authSchemes: string[];
  availableActions: number;
  lastConnectionAttempt?: string;
  connections: IntegrationConnection[];
}

export interface IntegrationDashboard {
  userId: string;
  totalIntegrations: number;
  connectedIntegrations: number;
  totalConnections: number;
  healthyConnections: number;
  categories: string[];
  popularIntegrations: string[];
  integrations: IntegrationSummary[];
  composioHealth: boolean;
  lastUpdated: string;
}

export interface IntegrationCategory {
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  serviceCount: number;
  connectedCount: number;
  services: string[];
}

export interface IntegrationStats {
  totalAvailable: number;
  totalConnected: number;
  totalConnections: number;
  activeConnections: number;
  failedConnections: number;
  categories: IntegrationCategory[];
}

export interface IntegrationActionRequest {
  provider: string;
  action: string;
  connectionId?: string;
  authConfigId?: string;
  parameters?: Record<string, unknown>;
}

export interface IntegrationActionResponse {
  success: boolean;
  message: string;
  redirectUrl?: string;
  connectionId?: string;
  data?: Record<string, unknown>;
}
