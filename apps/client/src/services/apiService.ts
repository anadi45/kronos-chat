import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type {
  AuthConfig,
  AuthConfigRequest,
  AuthConfigUpdateRequest,
  AuthConfigListResponse,
  Toolkit,
  ToolkitAction as Action,
  ConnectedAccount,
  ConnectionRequest,
  EnhancedConnectionRequest,
  ConnectionResponse,
  ToolExecuteRequest,
  ToolExecuteResponse,
  UserSignup,
  UserLogin,
  AuthToken,
  UserProfile,
  IntegrationSummary,
  IntegrationDashboard,
  IntegrationCategory,
  IntegrationStats,
  IntegrationActionRequest,
  IntegrationActionResponse,
  ChatRequest,
  ChatResponse,
  StreamChatRequest,
} from '@kronos/shared-types';

// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

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
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add authorization header if token exists
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        console.log(
          `API Request: ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        console.error(
          'API Response Error:',
          error.response?.data || error.message
        );

        // Handle 401 Unauthorized - try to refresh token
        if (error.response?.status === 401 && error.config && !error.config._retry) {
          error.config._retry = true;
          
          try {
            await this.refreshToken();
            // Retry the original request with new token
            const token = localStorage.getItem('accessToken');
            if (token) {
              error.config.headers.Authorization = `Bearer ${token}`;
              return this.client.request(error.config);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.logout();
            window.location.href = '/';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Authentication Methods
  async signup(userData: UserSignup): Promise<UserProfile> {
    const response = await this.client.post('/auth/register', userData);
    return response.data;
  }

  async login(credentials: UserLogin): Promise<AuthToken> {
    const response = await this.client.post('/auth/login', credentials);
    const token = response.data;

    // Store token in localStorage
    localStorage.setItem('accessToken', token.accessToken);
    localStorage.setItem('tokenType', token.tokenType);
    localStorage.setItem('expiresIn', token.expiresIn.toString());
    localStorage.setItem('loginTime', Date.now().toString());

    return token;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      // Clear token from localStorage regardless of API call result
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tokenType');
      localStorage.removeItem('expiresIn');
      localStorage.removeItem('loginTime');
    }
  }

  async getCurrentUser(): Promise<UserProfile> {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  async refreshToken(): Promise<AuthToken> {
    const response = await this.client.post('/auth/refresh');
    const token = response.data;

    // Store new token in localStorage
    localStorage.setItem('accessToken', token.accessToken);
    localStorage.setItem('tokenType', token.tokenType);
    localStorage.setItem('expiresIn', token.expiresIn.toString());
    localStorage.setItem('loginTime', Date.now().toString());

    return token;
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    const loginTime = localStorage.getItem('loginTime');
    const expiresIn = localStorage.getItem('expiresIn');

    if (!token || !loginTime || !expiresIn) {
      return false;
    }

    const now = Date.now();
    const loginTimestamp = parseInt(loginTime);
    const expirationTime = loginTimestamp + parseInt(expiresIn) * 1000;

    if (now >= expirationTime) {
      // Token expired, clear storage synchronously
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tokenType');
      localStorage.removeItem('expiresIn');
      localStorage.removeItem('loginTime');
      return false;
    }

    return true;
  }

  // Health Check
  async checkComposioHealth(): Promise<{
    configured: boolean;
    message: string;
  }> {
    const response = await this.client.get('/composio/health');
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
    const response = await this.client.get('/composio/auth-configs', {
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
    const response = await this.client.post('/composio/auth-configs', request);
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
    const response = await this.client.get('/composio/toolkits', { params });
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
      '/composio/connections/initiate',
      request
    );
    return response.data;
  }

  async initiateEnhancedConnection(
    request: EnhancedConnectionRequest
  ): Promise<ConnectionResponse> {
    const response = await this.client.post(
      '/composio/connections/initiate-enhanced',
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
    const response = await this.client.post('/composio/tools/execute', request);
    return response.data;
  }

  // Integration Dashboard Methods
  async getIntegrationDashboard(): Promise<IntegrationDashboard> {
    const response = await this.client.get('/integrations/dashboard');
    return response.data;
  }

  async getIntegrationStats(): Promise<IntegrationStats> {
    const response = await this.client.get('/integrations/stats');
    return response.data;
  }

  async getIntegrationSummary(params?: {
    category?: string;
    connected_only?: boolean;
    search?: string;
  }): Promise<IntegrationSummary[]> {
    const response = await this.client.get('/integrations/summary', { params });
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
      '/integrations/action',
      actionRequest
    );
    return response.data;
  }

  async getIntegrationCategories(): Promise<{
    categories: IntegrationCategory[];
    total_categories: number;
  }> {
    const response = await this.client.get('/integrations/categories');
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
    const response = await this.client.get('/integrations/health');
    return response.data;
  }

  // Chat Methods
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.client.post('/chat/message', request);
    return response.data;
  }

  async streamChatMessage(request: StreamChatRequest): Promise<ReadableStream> {
    const response = await fetch(
      `${this.client.defaults.baseURL}/chat/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    return response.body;
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;
