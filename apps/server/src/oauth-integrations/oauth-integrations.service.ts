import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Composio } from '@composio/core';
import { Integration } from '@kronos/core';
import { AVAILABLE_INTEGRATIONS } from '../constants/integrations.constants';


/**
 * Integration status interface
 */
export interface IntegrationStatus {
  configured: boolean;
  integrations: Integration[];
}

/**
 * Interface for creating a new integration connection
 */
export interface CreateIntegrationRequest {
  userId: string;
  provider: string; // e.g., 'GMAIL', 'SLACK', 'NOTION', etc.
}

/**
 * Response for successful connection creation
 */
export interface CreateIntegrationResponse {
  connectionId: string;
  redirectUrl: string;
  provider: string;
  status: 'INITIATED';
}

/**
 * Request payload for sending emails via Gmail integration
 */
export interface SendEmailRequest {
  userId: string;
  recipient: string;
  subject: string;
  content: string;
  overwriteRecipient?: string;
}

/**
 * Response for email sending operation
 */
export interface SendEmailResponse {
  success: boolean;
  message: string;
  toolsAvailable: boolean;
  executionResult?: any;
}

/**
 * Available integration provider information
 */
export interface IntegrationProvider {
  name: string;
  displayName: string;
  description: string;
  category:
    | 'PRODUCTIVITY'
    | 'COMMUNICATION'
    | 'DEVELOPMENT'
    | 'STORAGE'
    | 'CALENDAR';
  isActive: boolean;
}

/**
 * Connected account information
 */
export interface ConnectedAccount {
  id: string;
  provider: string;
  status:
    | 'INITIALIZING'
    | 'INITIATED'
    | 'ACTIVE'
    | 'INACTIVE'
    | 'FAILED'
    | 'EXPIRED';
  connectedAt: string;
  lastUsed?: string;
}

/**
 * Professional service for managing OAuth integrations
 * Handles OAuth connections, tool management, and integration operations
 */
@Injectable()
export class OAuthIntegrationsService {
  private readonly logger = new Logger(OAuthIntegrationsService.name);
  private readonly composio: Composio;
  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('COMPOSIO_API_KEY');

    if (!apiKey) {
      throw new Error(
        'COMPOSIO_API_KEY is required but not configured. Please set the COMPOSIO_API_KEY environment variable.'
      );
    }

    this.composio = new Composio({ apiKey });
    this.logger.log('OAuth integrations service initialized successfully');
  }

  /**
   * Creates an authentication configuration for a specific provider
   * This should be called once per provider and the config ID should be stored in database
   *
   * @param provider - The integration provider (e.g., 'GMAIL', 'SLACK')
   * @returns Promise<string> - The authentication configuration ID
   */
  async createAuthConfiguration(provider: string): Promise<string> {
    try {
      this.logger.log(
        `Creating authentication configuration for provider: ${provider}`
      );

      const authConfig = await this.composio.authConfigs.create(provider);

      this.logger.log(
        `Authentication configuration created successfully: ${authConfig.id}`
      );
      return authConfig.id;
    } catch (error) {
      this.logger.error(
        `Failed to create authentication configuration for ${provider}:`,
        error
      );
      throw new BadRequestException(
        `Unable to create authentication configuration for ${provider}. Please verify the provider name and try again.`
      );
    }
  }

  /**
   * Initiates a new integration connection for a user
   *
   * @param request - The connection creation request
   * @returns Promise<CreateIntegrationResponse> - Connection details including redirect URL
   */
  async createIntegrationConnection(
    request: CreateIntegrationRequest
  ): Promise<CreateIntegrationResponse> {
    try {
      this.logger.log(
        `Initiating integration connection for user ${request.userId} with provider ${request.provider}`
      );

      // Get or create auth configuration for the provider
      const authConfigId = await this.getOrCreateAuthConfiguration(
        request.provider
      );
      console.dir(authConfigId, { depth: null });

      const connection = await this.composio.connectedAccounts.initiate(
        request.userId,
        authConfigId
      );
      console.dir(connection, { depth: null });

      this.logger.log(
        `Integration connection initiated successfully: ${connection.id}`
      );

      return {
        connectionId: connection.id,
        redirectUrl: connection.redirectUrl,
        provider: request.provider,
        status: 'INITIATED',
      };
    } catch (error) {
      this.logger.error(`Failed to create integration connection:`, error);
      throw new BadRequestException(
        `Unable to create integration connection for ${request.provider}. Please try again.`
      );
    }
  }

  /**
   * Retrieves all connected accounts for a user
   *
   * @param userId - The user identifier
   * @returns Promise<ConnectedAccount[]> - Array of connected accounts
   */
  async getConnectedAccounts(userId: string): Promise<ConnectedAccount[]> {
    try {
      this.logger.log(`Retrieving connected accounts for user ${userId}`);

      const response = await this.composio.connectedAccounts.list({
        userIds: [userId],
      });

      const accounts: ConnectedAccount[] = response.items.map((item) => ({
        id: item.id,
        provider: item.toolkit.slug,
        status: item.status,
        connectedAt: item.createdAt,
        lastUsed: item.updatedAt,
      }));

      this.logger.log(`Found ${accounts.length} connected accounts`);
      return accounts;
    } catch (error) {
      this.logger.error(`Failed to retrieve connected accounts:`, error);
      throw new BadRequestException(
        'Unable to retrieve connected accounts. Please try again.'
      );
    }
  }

  /**
   * Disconnects a specific integration account using Composio auth-configs delete API
   *
   * @param userId - The user identifier
   * @param connectionId - The connection identifier to disconnect
   * @returns Promise<{ success: boolean }> - Success status
   */
  async disconnectIntegration(
    userId: string,
    connectionId: string
  ): Promise<{ success: boolean }> {
    try {
      this.logger.log(
        `Disconnecting integration ${connectionId} for user ${userId}`
      );

      // First, get the connection details to find the auth config
      const connectedAccounts = await this.getConnectedAccounts(userId);
      const account = connectedAccounts.find(acc => acc.id === connectionId);
      
      if (!account) {
        throw new NotFoundException('Integration connection not found');
      }

      // Get the auth config ID for this provider
      const authConfigId = await this.getAuthConfigIdForProvider(account.provider);
      
      if (authConfigId) {
        // Use Composio auth-configs delete API as per documentation
        await this.composio.authConfigs.delete(authConfigId);
        this.logger.log(`Auth config ${authConfigId} deleted successfully`);
      }

      // Also delete the connected account
      await this.composio.connectedAccounts.delete(connectionId);

      this.logger.log(`Integration ${connectionId} disconnected successfully`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to disconnect integration:`, error);
      throw new BadRequestException(
        'Unable to disconnect integration. Please try again.'
      );
    }
  }

  /**
   * Retrieves all available integration providers
   *
   * @returns Promise<IntegrationProvider[]> - Array of available providers
   */
  async getAvailableProviders(): Promise<IntegrationProvider[]> {
    try {
      // In a production environment, this would typically fetch from Composio's API
      // For now, returning a curated list of popular integrations
      const providers: IntegrationProvider[] = [
        {
          name: 'GMAIL',
          displayName: 'Gmail',
          description: 'Send and manage emails through Gmail',
          category: 'COMMUNICATION',
          isActive: true,
        },
        {
          name: 'SLACK',
          displayName: 'Slack',
          description: 'Send messages and manage Slack channels',
          category: 'COMMUNICATION',
          isActive: true,
        },
        {
          name: 'NOTION',
          displayName: 'Notion',
          description: 'Create and manage Notion pages and databases',
          category: 'PRODUCTIVITY',
          isActive: true,
        },
        {
          name: 'GOOGLE_CALENDAR',
          displayName: 'Google Calendar',
          description: 'Manage calendar events and scheduling',
          category: 'CALENDAR',
          isActive: true,
        },
        {
          name: 'GOOGLE_DRIVE',
          displayName: 'Google Drive',
          description: 'Manage files and folders in Google Drive',
          category: 'STORAGE',
          isActive: true,
        },
        {
          name: 'GITHUB',
          displayName: 'GitHub',
          description: 'Manage repositories, issues, and pull requests',
          category: 'DEVELOPMENT',
          isActive: true,
        },
        {
          name: 'TRELLO',
          displayName: 'Trello',
          description: 'Manage boards, lists, and cards',
          category: 'PRODUCTIVITY',
          isActive: true,
        },
      ];

      this.logger.log(
        `Retrieved ${providers.length} available integration providers`
      );
      return providers;
    } catch (error) {
      this.logger.error(`Failed to retrieve available providers:`, error);
      throw new BadRequestException(
        'Unable to retrieve available integration providers. Please try again.'
      );
    }
  }

  /**
   * Gets or creates an authentication configuration for a provider
   * In production, this should be stored in a database
   *
   * @param provider - The provider name
   * @returns Promise<string> - The authentication configuration ID
   */
  private async getOrCreateAuthConfiguration(
    provider: string
  ): Promise<string> {
    // In a production environment, you should:
    // 1. Check if an auth config already exists for this provider
    // 2. Store auth config IDs in a database
    // 3. Reuse existing configs instead of creating new ones

    return await this.createAuthConfiguration(provider);
  }

  /**
   * Gets the authentication configuration ID for a provider
   * In production, this should be retrieved from a database
   *
   * @param provider - The provider name
   * @returns Promise<string | null> - The authentication configuration ID or null if not found
   */
  private async getAuthConfigIdForProvider(provider: string): Promise<string | null> {
    try {
      // In a production environment, you should:
      // 1. Query the database for existing auth config IDs
      // 2. Store and retrieve auth config IDs from a database
      // For now, we'll try to get existing auth configs from Composio
      
      const authConfigs = await this.composio.authConfigs.list();
      const authConfig = authConfigs.items.find(config => 
        config.toolkit.slug.toLowerCase() === provider.toLowerCase()
      );
      
      return authConfig?.id || null;
    } catch (error) {
      this.logger.error(`Failed to get auth config for provider ${provider}:`, error);
      return null;
    }
  }

  /**
   * Get all available integrations with connection status for a user
   */
  async getAvailableIntegrations(userId: string): Promise<Integration[]> {
    try {
      // Get connected accounts from OAuth integrations service
      const connectedAccounts = await this.getConnectedAccounts(userId);
      
      // Get all available integrations
      const allIntegrations = AVAILABLE_INTEGRATIONS;

      // Create a map of connected integrations for quick lookup
      const connectedMap = new Map();
      connectedAccounts.forEach(account => {
        connectedMap.set(account.provider.toLowerCase(), account);
      });

      // Mark connection status for each integration
      const integrationsWithStatus = allIntegrations.map(integration => {
        const connectedAccount = connectedMap.get(integration.id);
        
        return {
          ...integration,
          isConnected: !!connectedAccount,
          connectedAt: connectedAccount?.connectedAt,
        };
      });

      return integrationsWithStatus;
    } catch (error) {
      this.logger.error(
        `Failed to get integrations for user ${userId}:`,
        error
      );
      // Return integrations without connection status if there's an error
      return AVAILABLE_INTEGRATIONS;
    }
  }


  /**
   * Get integration status and configuration
   */
  async getIntegrationStatus(userId: string): Promise<IntegrationStatus> {
    const isConfigured = this.isServiceConfigured();
    const integrations = await this.getAvailableIntegrations(userId);

    return {
      configured: isConfigured,
      integrations,
    };
  }

  /**
   * Connect to a specific integration
   */
  async connectIntegration(userId: string, provider: string): Promise<any> {
    try {
      // For now, delegate to OAuth integrations service for OAuth connections
      if (provider === 'gmail') {
        const connectionResult = await this.createIntegrationConnection({
          userId,
          provider: 'GMAIL',
        });

        // Transform the response to match frontend expectations
        return {
          success: true,
          authUrl: connectionResult.redirectUrl,
          provider: connectionResult.provider,
          status: 'available' as const,
          connectionId: connectionResult.connectionId,
        };
      }

      // For other integrations, return a placeholder response
      return {
        success: false,
        message: `${provider} integration is coming soon`,
        status: 'coming_soon' as const,
        provider,
      };
    } catch (error) {
      this.logger.error(
        `Failed to connect integration ${provider} for user ${userId}:`,
        error
      );
      return {
        success: false,
        message: `Failed to connect ${provider} integration. Please try again.`,
        provider,
        status: 'available' as const,
      };
    }
  }

  /**
   * Disconnect from a specific integration by provider name
   * This method uses the Composio auth-configs delete API pattern
   */
  async disconnectIntegrationByProvider(
    userId: string,
    provider: string
  ): Promise<{ success: boolean }> {
    try {
      this.logger.log(
        `Disconnecting integration ${provider} for user ${userId}`
      );

      // Get connected accounts to find the connection ID
      const connectedAccounts = await this.getConnectedAccounts(userId);
      const account = connectedAccounts.find(
        (acc) => acc.provider.toLowerCase() === provider.toLowerCase()
      );

      if (!account) {
        this.logger.warn(`No connected account found for provider ${provider}`);
        return { success: false };
      }

      // Use the auth-configs delete API for the provider
      const authConfigResult = await this.deleteAuthConfigForProvider(userId, provider);
      
      if (!authConfigResult.success) {
        this.logger.warn(`Failed to delete auth config for provider ${provider}, but continuing with connection deletion`);
      }

      // Also delete the connected account
      await this.composio.connectedAccounts.delete(account.id);

      this.logger.log(`Integration ${provider} disconnected successfully`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to disconnect integration ${provider} for user ${userId}:`,
        error
      );
      return { success: false };
    }
  }

  /**
   * Get integration details and capabilities
   */
  async getIntegrationDetails(provider: string): Promise<Integration | null> {
    const integrations = AVAILABLE_INTEGRATIONS;
    return (
      integrations.find((integration) => integration.id === provider) || null
    );
  }

  /**
   * Deletes an authentication configuration for a specific provider
   * This method finds the auth config for the user's provider and deletes it
   * Following Composio auth-configs delete API pattern from the documentation
   *
   * @param userId - The user identifier
   * @param provider - The integration provider identifier
   * @returns Promise<{ success: boolean }> - Success status
   */
  async deleteAuthConfigForProvider(
    userId: string,
    provider: string
  ): Promise<{ success: boolean }> {
    try {
      this.logger.log(
        `Deleting auth config for provider ${provider} for user ${userId}`
      );

      // Get the auth config ID for this provider
      const authConfigId = await this.getAuthConfigIdForProvider(provider);
      
      if (!authConfigId) {
        this.logger.warn(`No auth config found for provider ${provider}`);
        return { success: false };
      }

      // Use Composio auth-configs delete API as per documentation
      await this.composio.authConfigs.delete(authConfigId);

      this.logger.log(`Auth config ${authConfigId} deleted successfully for provider ${provider}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete auth config for provider ${provider}:`, error);
      throw new BadRequestException(
        'Unable to delete authentication configuration. Please try again.'
      );
    }
  }

  /**
   * Checks if the service is properly configured
   * Since we throw an error during initialization if not configured,
   * this will always return true if the service instance exists
   *
   * @returns boolean - Configuration status
   */
  isServiceConfigured(): boolean {
    return true;
  }
}
