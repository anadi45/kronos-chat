import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  NotImplementedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Composio } from '@composio/core';
import {
  Integration,
  Provider,
  ConnectIntegrationResponse,
  DisconnectIntegrationResponse,
} from '@kronos/core';
import { AVAILABLE_INTEGRATIONS } from '../constants/integrations.constants';
import { User } from '../entities/user.entity';
import { ComposioOAuth } from '../entities/composio-oauth.entity';

/**
 * Interface for creating a new integration connection
 */
export interface CreateIntegrationRequest {
  userId: string;
  provider: Provider;
}

/**
 * Response for successful connection creation
 */
export interface CreateIntegrationResponse {
  connectionId: string;
  redirectUrl: string;
  provider: Provider;
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
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ComposioOAuth)
    private readonly composioOAuthRepository: Repository<ComposioOAuth>
  ) {
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

      // Store the auth config ID in the composio_oauth table
      await this.composioOAuthRepository.upsert(
        {
          userId: request.userId,
          platform: request.provider,
          authConfigId: authConfigId,
        },
        ['userId', 'platform']
      );

      const connection = await this.composio.connectedAccounts.initiate(
        request.userId,
        authConfigId
      );

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
      const account = connectedAccounts.find((acc) => acc.id === connectionId);

      if (!account) {
        throw new NotFoundException('Integration connection not found');
      }

      // Get the auth config ID from the composio_oauth table
      const authConfigId = await this.getAuthConfigIdForUser(userId);

      if (authConfigId) {
        // Use Composio auth-configs delete API as per documentation
        await this.composio.authConfigs.delete(authConfigId);
        this.logger.log(`Auth config ${authConfigId} deleted successfully`);

        // Remove the auth config record from composio_oauth table
        await this.composioOAuthRepository.delete({ userId, authConfigId });
      }

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
   * Gets the authentication configuration ID for a user and platform
   * This retrieves the Composio auth config ID from the composio_oauth table
   *
   * @param userId - The user ID
   * @param platform - The platform name (optional, if not provided returns first available)
   * @returns Promise<string | null> - The authentication configuration ID or null if not found
   */
  private async getAuthConfigIdForUser(
    userId: string,
    platform?: string
  ): Promise<string | null> {
    try {
      const whereCondition: any = { userId };
      if (platform) {
        whereCondition.platform = platform;
      }

      const composioOAuth = await this.composioOAuthRepository.findOne({
        where: whereCondition,
        order: { createdAt: 'DESC' }, // Get the most recent one if multiple exist
      });

      if (!composioOAuth) {
        this.logger.warn(
          `No auth config found for user ${userId}${
            platform ? ` and platform ${platform}` : ''
          }`
        );
        return null;
      }

      return composioOAuth.authConfigId;
    } catch (error) {
      this.logger.error(`Failed to get auth config for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get all OAuth integrations for a user
   */
  async getUserOAuthIntegrations(userId: string): Promise<ComposioOAuth[]> {
    try {
      const integrations = await this.composioOAuthRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });

      this.logger.log(
        `Found ${integrations.length} OAuth integrations for user ${userId}`
      );
      return integrations;
    } catch (error) {
      this.logger.error(
        `Failed to get OAuth integrations for user ${userId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Get all available integrations with connection status for a user
   */
  async getAvailableIntegrations(userId: string): Promise<Integration[]> {
    try {
      // Get user's OAuth integrations from our database (source of truth)
      const userOAuthIntegrations = await this.getUserOAuthIntegrations(userId);

      // Get all available integrations
      const allIntegrations = AVAILABLE_INTEGRATIONS;

      // Create a map of user's connected integrations for quick lookup
      const userIntegrationsMap = new Map();
      userOAuthIntegrations.forEach((integration) => {
        userIntegrationsMap.set(
          integration.platform.toLowerCase(),
          integration
        );
      });

      // Mark connection status for each integration based on our database
      const integrationsWithStatus = allIntegrations.map((integration) => {
        const userIntegration = userIntegrationsMap.get(
          integration.id.toLowerCase()
        );

        return {
          ...integration,
          isConnected: !!userIntegration,
          connectedAt: userIntegration?.createdAt,
          authConfigId: userIntegration?.authConfigId,
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
   * Connect to a specific integration
   */
  async connectIntegration(
    userId: string,
    provider: Provider
  ): Promise<ConnectIntegrationResponse> {
    try {
      const connectionResult = await this.createIntegrationConnection({
        userId,
        provider,
      });

      // Transform the response to match frontend expectations
      return {
        success: true,
        authUrl: connectionResult.redirectUrl,
        provider: connectionResult.provider,
        status: 'available' as const,
        connectionId: connectionResult.connectionId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to connect integration ${provider} for user ${userId}:`,
        error
      );

      // Re-throw HTTP exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof NotImplementedException
      ) {
        throw error;
      }

      // For unexpected errors, throw InternalServerErrorException
      throw new InternalServerErrorException(
        `Failed to connect ${provider} integration. Please try again.`
      );
    }
  }

  /**
   * Disconnect from a specific integration by provider name
   * This method uses the Composio auth-configs delete API pattern
   */
  async disconnectIntegrationByProvider(
    userId: string,
    provider: Provider
  ): Promise<DisconnectIntegrationResponse> {
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
        throw new NotFoundException(
          `No connected account found for ${provider} integration`
        );
      }

      // Get the auth config ID from the composio_oauth table for this specific platform
      const authConfigId = await this.getAuthConfigIdForUser(userId, provider);

      // Prepare concurrent deletion operations
      const deletionPromises: Promise<any>[] = [
        this.composio.connectedAccounts.delete(account.id),
      ];

      if (authConfigId) {
        // Add auth config deletion operations
        deletionPromises.push(
          this.composio.authConfigs.delete(authConfigId),
          this.composioOAuthRepository.delete({ userId, platform: provider })
        );
      }

      // Execute all deletions concurrently
      await Promise.all(deletionPromises);

      if (authConfigId) {
        this.logger.log(`Auth config ${authConfigId} deleted successfully`);
      }

      this.logger.log(`Integration ${provider} disconnected successfully`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to disconnect integration ${provider} for user ${userId}:`,
        error
      );

      // Re-throw HTTP exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof NotImplementedException
      ) {
        throw error;
      }

      // For unexpected errors, throw InternalServerErrorException
      throw new InternalServerErrorException(
        `Failed to disconnect ${provider} integration. Please try again.`
      );
    }
  }

  /**
   * Get integration details and capabilities
   */
  async getIntegrationDetails(provider: Provider): Promise<Integration | null> {
    const integrations = AVAILABLE_INTEGRATIONS;
    return (
      integrations.find((integration) => integration.id === provider) || null
    );
  }

  /**
   * Deletes an authentication configuration for a user
   * This method uses the user's stored Composio auth config ID
   * Following Composio auth-configs delete API pattern from the documentation
   *
   * @param userId - The user identifier
   * @param provider - The integration provider identifier (for logging purposes)
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

      // Get the auth config ID from the composio_oauth table for this specific platform
      const authConfigId = await this.getAuthConfigIdForUser(userId, provider);

      if (!authConfigId) {
        this.logger.warn(
          `No auth config found for user ${userId} and platform ${provider}`
        );
        return { success: false };
      }

      // Use Composio auth-configs delete API as per documentation
      await this.composio.authConfigs.delete(authConfigId);

      // Remove the auth config record from composio_oauth table
      await this.composioOAuthRepository.delete({ userId, platform: provider });

      this.logger.log(
        `Auth config ${authConfigId} deleted successfully for user ${userId}`
      );
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to delete auth config for user ${userId}:`,
        error
      );
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
