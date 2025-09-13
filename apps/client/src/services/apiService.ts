import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type {
  UserSignup,
  UserLogin,
  AuthToken,
  UserProfile,
  ChatRequest,
  ChatResponse,
  StreamChatRequest,
  Integration,
  IntegrationStatus,
  ConnectIntegrationResponse,
  DisconnectIntegrationResponse,
  IntegrationDetails,
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

  // Integration Methods

  /**
   * Get all available integrations
   * GET /integrations
   */
  async getAvailableIntegrations(): Promise<Integration[]> {
    const response = await this.client.get('/integrations');
    return response.data;
  }

  /**
   * Get user's connected integrations
   * GET /integrations/connected
   */
  async getConnectedIntegrations(): Promise<Integration[]> {
    const response = await this.client.get('/integrations/connected');
    return response.data;
  }

  /**
   * Get integration status and configuration
   * GET /integrations/status
   */
  async getIntegrationStatus(): Promise<IntegrationStatus> {
    const response = await this.client.get('/integrations/status');
    return response.data;
  }

  /**
   * Connect to a specific integration
   * POST /integrations/:provider/connect
   */
  async connectIntegration(provider: string): Promise<ConnectIntegrationResponse> {
    const response = await this.client.post(`/integrations/${provider}/connect`);
    return response.data;
  }

  /**
   * Disconnect from a specific integration
   * DELETE /integrations/:provider/disconnect
   */
  async disconnectIntegration(provider: string): Promise<DisconnectIntegrationResponse> {
    const response = await this.client.delete(`/integrations/${provider}/disconnect`);
    return response.data;
  }

  /**
   * Get integration details and capabilities
   * GET /integrations/:provider
   */
  async getIntegrationDetails(provider: string): Promise<IntegrationDetails> {
    const response = await this.client.get(`/integrations/${provider}`);
    return response.data;
  }

  // Composio-specific endpoints (routed through integrations)

  /**
   * Get available integration providers from Composio
   * GET /integrations/providers
   */
  async getAvailableProviders(): Promise<any[]> {
    const response = await this.client.get('/integrations/providers');
    return response.data;
  }

  /**
   * Create integration connection via Composio
   * POST /integrations/connections
   */
  async createIntegrationConnection(request: any): Promise<any> {
    const response = await this.client.post('/integrations/connections', request);
    return response.data;
  }

  /**
   * Get connected accounts via Composio
   * GET /integrations/connections
   */
  async getConnectedAccounts(): Promise<any[]> {
    const response = await this.client.get('/integrations/connections');
    return response.data;
  }

  /**
   * Disconnect integration connection via Composio
   * DELETE /integrations/connections/:connectionId
   */
  async disconnectIntegrationConnection(connectionId: string): Promise<{ success: boolean }> {
    const response = await this.client.delete(`/integrations/connections/${connectionId}`);
    return response.data;
  }

  /**
   * Get available tools via Composio
   * GET /integrations/tools
   */
  async getAvailableTools(toolkits?: string): Promise<any[]> {
    const params = toolkits ? { toolkits } : {};
    const response = await this.client.get('/integrations/tools', { params });
    return response.data;
  }

  /**
   * Send email via Gmail integration
   * POST /integrations/email/send
   */
  async sendEmail(request: any): Promise<any> {
    const response = await this.client.post('/integrations/email/send', request);
    return response.data;
  }

  /**
   * Create auth configuration for a provider
   * POST /integrations/auth-configs/:provider
   */
  async createAuthConfiguration(provider: string): Promise<any> {
    const response = await this.client.post(`/integrations/auth-configs/${provider}`);
    return response.data;
  }

  /**
   * Get service configuration status
   * GET /integrations/service/status
   */
  async getServiceStatus(): Promise<{ configured: boolean; message: string }> {
    const response = await this.client.get('/integrations/service/status');
    return response.data;
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;
