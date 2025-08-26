import axios, { type AxiosInstance, type AxiosResponse } from "axios";

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

// Authentication types
export interface UserSignup {
  email: string;
  password: string;
  confirm_password: string;
  first_name?: string;
  last_name?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  profile_image_url?: string;
  last_login?: string;
  created_at: string;
  updated_at?: string;
}

// Integration Dashboard types
export interface IntegrationConnection {
  account_id: string;
  status: "active" | "inactive" | "pending" | "error" | "disabled";
  created_at?: string;
  last_used?: string;
  error_message?: string;
}

export interface IntegrationSummary {
  provider: string;
  display_name: string;
  description?: string;
  logo_url?: string;
  categories: string[];
  total_connections: number;
  active_connections: number;
  inactive_connections: number;
  error_connections: number;
  health: "healthy" | "warning" | "error" | "unknown";
  health_message?: string;
  has_auth_config: boolean;
  auth_schemes: string[];
  available_actions: number;
  last_connection_attempt?: string;
  connections: IntegrationConnection[];
}

export interface IntegrationDashboard {
  user_id: string;
  total_integrations: number;
  connected_integrations: number;
  total_connections: number;
  healthy_connections: number;
  categories: string[];
  popular_integrations: string[];
  integrations: IntegrationSummary[];
  composio_health: boolean;
  last_updated: string;
}

export interface IntegrationCategory {
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  service_count: number;
  connected_count: number;
  services: string[];
}

export interface IntegrationStats {
  total_available: number;
  total_connected: number;
  total_connections: number;
  active_connections: number;
  failed_connections: number;
  categories: IntegrationCategory[];
}

export interface IntegrationActionRequest {
  provider: string;
  action: string;
  connection_id?: string;
  auth_config_id?: string;
  parameters?: Record<string, unknown>;
}

export interface IntegrationActionResponse {
  success: boolean;
  message: string;
  redirect_url?: string;
  connection_id?: string;
  data?: Record<string, unknown>;
}

// Chat types
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatResponse {
  message: string;
  conversation_id: string;
  timestamp: string;
}

export interface StreamChatRequest {
  message: string;
  conversation_history?: ChatMessage[];
  conversation_id?: string;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
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
        // Add authorization header if token exists
        const token = localStorage.getItem("access_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

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

  // Authentication Methods
  async signup(userData: UserSignup): Promise<UserProfile> {
    const response = await this.client.post("/auth/signup", userData);
    return response.data;
  }

  async login(credentials: UserLogin): Promise<AuthToken> {
    const response = await this.client.post("/auth/login", credentials);
    const token = response.data;

    // Store token in localStorage
    localStorage.setItem("access_token", token.access_token);
    localStorage.setItem("token_type", token.token_type);
    localStorage.setItem("expires_in", token.expires_in.toString());
    localStorage.setItem("login_time", Date.now().toString());

    return token;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post("/auth/logout");
    } finally {
      // Clear token from localStorage regardless of API call result
      localStorage.removeItem("access_token");
      localStorage.removeItem("token_type");
      localStorage.removeItem("expires_in");
      localStorage.removeItem("login_time");
    }
  }

  async getCurrentUser(): Promise<UserProfile> {
    const response = await this.client.get("/auth/me");
    return response.data;
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem("access_token");
    const loginTime = localStorage.getItem("login_time");
    const expiresIn = localStorage.getItem("expires_in");

    if (!token || !loginTime || !expiresIn) {
      return false;
    }

    const now = Date.now();
    const loginTimestamp = parseInt(loginTime);
    const expirationTime = loginTimestamp + parseInt(expiresIn) * 1000;

    if (now >= expirationTime) {
      // Token expired, clear storage
      this.logout();
      return false;
    }

    return true;
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

  // Integration Dashboard Methods
  async getIntegrationDashboard(): Promise<IntegrationDashboard> {
    const response = await this.client.get("/integrations/dashboard");
    return response.data;
  }

  async getIntegrationStats(): Promise<IntegrationStats> {
    const response = await this.client.get("/integrations/stats");
    return response.data;
  }

  async getIntegrationSummary(params?: {
    category?: string;
    connected_only?: boolean;
    search?: string;
  }): Promise<IntegrationSummary[]> {
    const response = await this.client.get("/integrations/summary", { params });
    return response.data;
  }

  async getIntegrationDetails(provider: string): Promise<IntegrationSummary> {
    const response = await this.client.get(`/integrations/${provider}/details`);
    return response.data;
  }

  async performIntegrationAction(
    actionRequest: IntegrationActionRequest
  ): Promise<IntegrationActionResponse> {
    const response = await this.client.post(
      "/integrations/action",
      actionRequest
    );
    return response.data;
  }

  async getIntegrationCategories(): Promise<{
    categories: IntegrationCategory[];
    total_categories: number;
  }> {
    const response = await this.client.get("/integrations/categories");
    return response.data;
  }

  async getIntegrationHealth(): Promise<{
    composio_health: boolean;
    total_connections: number;
    healthy_connections: number;
    failed_connections: number;
    health_percentage: number;
    status: string;
    last_updated: string;
  }> {
    const response = await this.client.get("/integrations/health");
    return response.data;
  }

  // Chat Methods
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.client.post("/chat/message", request);
    return response.data;
  }

  async streamChatMessage(request: StreamChatRequest): Promise<ReadableStream> {
    const response = await fetch(
      `${this.client.defaults.baseURL}/chat/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    return response.body;
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;
