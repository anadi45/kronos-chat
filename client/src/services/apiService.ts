import axios, { AxiosInstance, AxiosResponse } from "axios";

// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// Types based on backend models
export interface AuthConfig {
  id: string;
  uuid: string;
  type: string;
  toolkit: {
    slug: string;
    name?: string;
    logo?: string;
  };
  name: string;
  status: string;
  no_of_connections: number;
  auth_scheme: string;
  is_composio_managed: boolean;
  created_at?: string;
  last_updated_at?: string;
}

export interface AuthConfigRequest {
  name: string;
  toolkit_slug: string;
  auth_scheme?: string;
  credentials?: Record<string, unknown>;
  proxy_config?: Record<string, unknown>;
}

export interface AuthConfigUpdateRequest {
  name?: string;
  credentials?: Record<string, unknown>;
  proxy_config?: Record<string, unknown>;
}

export interface Toolkit {
  slug: string;
  name: string;
  description: string;
  logo: string;
  categories: string[];
  auth_schemes: string[];
}

export interface Action {
  name: string;
  display_name: string;
  description: string;
  parameters: Record<string, unknown>;
  response: Record<string, unknown>;
  app_name: string;
}

export interface ConnectedAccount {
  account_id: string;
  status: string;
  provider: string;
  created_at?: string;
}

export interface ConnectionRequest {
  user_id: string;
  provider: string;
  callback_url?: string;
  scope?: string[];
}

export interface EnhancedConnectionRequest {
  user_id: string;
  app_name: string;
  auth_config_id?: string;
  redirect_url?: string;
  labels?: string[];
}

export interface ConnectionResponse {
  connection_id: string;
  redirect_url: string;
  status: string;
}

export interface ToolExecuteRequest {
  user_id: string;
  action_name: string;
  params: Record<string, unknown>;
  connected_account_id?: string;
}

export interface ToolExecuteResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export interface AuthConfigListResponse {
  items: AuthConfig[];
  total_pages: number;
  current_page: number;
  total_items: number;
  next_cursor?: string;
}

/**
 * API Service for Kronos Chat Backend
 * Handles all communication with the FastAPI backend
 */
class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 seconds
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(
          `API Request: ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error) => {
        console.error("API Request Error:", error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(
          "API Response Error:",
          error.response?.data || error.message
        );
        return Promise.reject(error);
      }
    );
  }

  // Health Check
  async checkComposioHealth(): Promise<{
    configured: boolean;
    message: string;
  }> {
    const response = await this.client.get("/composio/health");
    return response.data;
  }

  // Auth Config Management
  async listAuthConfigs(params?: {
    is_composio_managed?: boolean;
    toolkit_slug?: string;
    show_disabled?: boolean;
    search?: string;
    limit?: number;
    cursor?: string;
  }): Promise<AuthConfigListResponse> {
    const response = await this.client.get("/composio/auth-configs", {
      params,
    });
    return response.data;
  }

  async getAuthConfig(authConfigId: string): Promise<AuthConfig> {
    const response = await this.client.get(
      `/composio/auth-configs/${authConfigId}`
    );
    return response.data;
  }

  async createAuthConfig(request: AuthConfigRequest): Promise<AuthConfig> {
    const response = await this.client.post("/composio/auth-configs", request);
    return response.data;
  }

  async updateAuthConfig(
    authConfigId: string,
    request: AuthConfigUpdateRequest
  ): Promise<AuthConfig> {
    const response = await this.client.put(
      `/composio/auth-configs/${authConfigId}`,
      request
    );
    return response.data;
  }

  async deleteAuthConfig(
    authConfigId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await this.client.delete(
      `/composio/auth-configs/${authConfigId}`
    );
    return response.data;
  }

  // Toolkit Management
  async getAvailableToolkits(params?: {
    search?: string;
    limit?: number;
  }): Promise<Toolkit[]> {
    const response = await this.client.get("/composio/toolkits", { params });
    return response.data;
  }

  async getToolkitActions(
    toolkitSlug: string,
    params?: {
      limit?: number;
    }
  ): Promise<Action[]> {
    const response = await this.client.get(
      `/composio/toolkits/${toolkitSlug}/actions`,
      { params }
    );
    return response.data;
  }

  // Connection Management
  async initiateConnection(
    request: ConnectionRequest
  ): Promise<ConnectionResponse> {
    const response = await this.client.post(
      "/composio/connections/initiate",
      request
    );
    return response.data;
  }

  async initiateEnhancedConnection(
    request: EnhancedConnectionRequest
  ): Promise<ConnectionResponse> {
    const response = await this.client.post(
      "/composio/connections/initiate-enhanced",
      request
    );
    return response.data;
  }

  async listConnections(userId: string): Promise<ConnectedAccount[]> {
    const response = await this.client.get(`/composio/connections/${userId}`);
    return response.data;
  }

  async getConnection(accountId: string): Promise<ConnectedAccount> {
    const response = await this.client.get(
      `/composio/connections/account/${accountId}`
    );
    return response.data;
  }

  async enableConnection(
    accountId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await this.client.post(
      `/composio/connections/${accountId}/enable`
    );
    return response.data;
  }

  async disableConnection(
    accountId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await this.client.post(
      `/composio/connections/${accountId}/disable`
    );
    return response.data;
  }

  async refreshConnection(
    accountId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await this.client.post(
      `/composio/connections/${accountId}/refresh`
    );
    return response.data;
  }

  async deleteConnection(
    accountId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await this.client.delete(
      `/composio/connections/${accountId}`
    );
    return response.data;
  }

  // Tool Execution
  async executeTool(request: ToolExecuteRequest): Promise<ToolExecuteResponse> {
    const response = await this.client.post("/composio/tools/execute", request);
    return response.data;
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;
