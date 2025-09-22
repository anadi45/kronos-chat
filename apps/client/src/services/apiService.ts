import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type {
  UserSignup,
  UserLogin,
  AuthToken,
  UserProfile,
  ChatRequest,
  Integration,
  ConnectIntegrationResponse,
  DisconnectIntegrationResponse,
  IntegrationDetails,
  PaginatedResponse,
  Conversation,
} from '@kronos/core';

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
  async sendChatMessage(request: ChatRequest, conversationId?: string): Promise<ReadableStream> {
    // Build URL with conversationId as query parameter if provided
    const url = new URL(`${this.client.defaults.baseURL}/chat`);
    if (conversationId) {
      url.searchParams.set('conversationId', conversationId);
    }
    
    const response = await fetch(
      url.toString(),
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

  /**
   * Get user's conversations (pagination required)
   * GET /chat/conversations
   */
  async getConversations(page: number, limit: number): Promise<PaginatedResponse<Conversation>> {
    const response = await this.client.get('/chat/conversations', {
      params: { page, limit }
    });
    return response.data;
  }

  /**
   * Get messages for a specific conversation
   * GET /chat/conversations/:conversationId/messages
   */
  async getConversationMessages(conversationId: string): Promise<{ messages: any[]; conversationId: string }> {
    const response = await this.client.get(`/chat/conversations/${conversationId}/messages`);
    return response.data;
  }

  /**
   * Delete a conversation
   * DELETE /chat/conversations/:conversationId
   */
  async deleteConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
    const response = await this.client.delete(`/chat/conversations/${conversationId}`);
    return response.data;
  }

  // OAuth Integration Methods

  /**
   * Get all available integrations
   * GET /oauth-integrations
   */
  async getAvailableIntegrations(): Promise<Integration[]> {
    const response = await this.client.get('/oauth-integrations');
    return response.data;
  }



  /**
   * Connect to a specific integration
   * POST /oauth-integrations/:provider/connect
   */
  async connectIntegration(provider: string): Promise<ConnectIntegrationResponse> {
    try {
      const response = await this.client.post(`/oauth-integrations/${provider}/connect`);
      return response.data;
    } catch (error: any) {
      // Handle specific HTTP status codes
      if (error.response?.status === 501) {
        throw new Error(`${provider} integration is not yet implemented`);
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || `Invalid request for ${provider} integration`);
      } else if (error.response?.status === 500) {
        throw new Error(`Server error while connecting to ${provider}. Please try again.`);
      } else {
        throw new Error(`Failed to connect to ${provider} integration. Please try again.`);
      }
    }
  }

  /**
   * Disconnect from a specific integration
   * DELETE /oauth-integrations/:provider/disconnect
   */
  async disconnectIntegration(provider: string): Promise<DisconnectIntegrationResponse> {
    try {
      const response = await this.client.delete(`/oauth-integrations/${provider}/disconnect`);
      return response.data;
    } catch (error: any) {
      // Handle specific HTTP status codes
      if (error.response?.status === 404) {
        throw new Error(`No connected account found for ${provider} integration`);
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || `Invalid request for ${provider} integration`);
      } else if (error.response?.status === 500) {
        throw new Error(`Server error while disconnecting from ${provider}. Please try again.`);
      } else {
        throw new Error(`Failed to disconnect from ${provider} integration. Please try again.`);
      }
    }
  }

  /**
   * Get integration details and capabilities
   * GET /oauth-integrations/:provider
   */
  async getIntegrationDetails(provider: string): Promise<IntegrationDetails> {
    const response = await this.client.get(`/oauth-integrations/${provider}`);
    return response.data;
  }

  // OAuth integrations endpoints

  /**
   * Get available integration providers from OAuth integrations
   * GET /oauth-integrations/providers
   */
  async getAvailableProviders(): Promise<any[]> {
    const response = await this.client.get('/oauth-integrations/providers');
    return response.data;
  }

  /**
   * Create integration connection via OAuth integrations
   * POST /oauth-integrations/connections
   */
  async createIntegrationConnection(request: any): Promise<any> {
    const response = await this.client.post('/oauth-integrations/connections', request);
    return response.data;
  }

  /**
   * Get connected accounts via OAuth integrations
   * GET /oauth-integrations/connections
   */
  async getConnectedAccounts(): Promise<any[]> {
    const response = await this.client.get('/oauth-integrations/connections');
    return response.data;
  }

  /**
   * Disconnect integration connection via OAuth integrations
   * DELETE /oauth-integrations/connections/:connectionId
   */
  async disconnectIntegrationConnection(connectionId: string): Promise<{ success: boolean }> {
    const response = await this.client.delete(`/oauth-integrations/connections/${connectionId}`);
    return response.data;
  }

  /**
   * Delete authentication configuration for a specific provider (following Composio API pattern)
   * DELETE /oauth-integrations/auth-configs/:provider
   */
  async deleteAuthConfigForProvider(provider: string): Promise<{ success: boolean }> {
    const response = await this.client.delete(`/oauth-integrations/auth-configs/${provider}`);
    return response.data;
  }

  /**
   * Get available tools via OAuth integrations
   * GET /oauth-integrations/tools
   */
  async getAvailableTools(toolkits?: string): Promise<any[]> {
    const params = toolkits ? { toolkits } : {};
    const response = await this.client.get('/oauth-integrations/tools', { params });
    return response.data;
  }

  /**
   * Send email via Gmail integration
   * POST /oauth-integrations/email/send
   */
  async sendEmail(request: any): Promise<any> {
    const response = await this.client.post('/oauth-integrations/email/send', request);
    return response.data;
  }

  /**
   * Create auth configuration for a provider
   * POST /oauth-integrations/auth-configs/:provider
   */
  async createAuthConfiguration(provider: string): Promise<any> {
    const response = await this.client.post(`/oauth-integrations/auth-configs/${provider}`);
    return response.data;
  }

}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;
