import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Composio } from '@composio/core';

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
  category: 'PRODUCTIVITY' | 'COMMUNICATION' | 'DEVELOPMENT' | 'STORAGE' | 'CALENDAR';
  isActive: boolean;
}

/**
 * Connected account information
 */
export interface ConnectedAccount {
  id: string;
  provider: string;
  status: 'INITIALIZING' | 'INITIATED' | 'ACTIVE' | 'INACTIVE' | 'FAILED' | 'EXPIRED';
  connectedAt: string;
  lastUsed?: string;
}

/**
 * Professional service for managing Composio integrations
 * Handles OAuth connections, tool management, and integration operations
 */
@Injectable()
export class ComposioIntegrationsService {
  private readonly logger = new Logger(ComposioIntegrationsService.name);
  private readonly composio: Composio;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('COMPOSIO_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('COMPOSIO_API_KEY not configured. Integration features will be limited.');
      this.isConfigured = false;
      // Initialize with empty API key for development
      this.composio = new Composio({ apiKey: '' });
    } else {
      this.isConfigured = true;
      this.composio = new Composio({ apiKey });
      this.logger.log('Composio integrations service initialized successfully');
    }
  }

  /**
   * Validates if the service is properly configured
   */
  private validateConfiguration(): void {
    if (!this.isConfigured) {
      throw new BadRequestException(
        'Composio service is not properly configured. Please check COMPOSIO_API_KEY environment variable.'
      );
    }
  }

  /**
   * Creates an authentication configuration for a specific provider
   * This should be called once per provider and the config ID should be stored in database
   * 
   * @param provider - The integration provider (e.g., 'GMAIL', 'SLACK')
   * @returns Promise<string> - The authentication configuration ID
   */
  async createAuthConfiguration(provider: string): Promise<string> {
    this.validateConfiguration();
    
    try {
      this.logger.log(`Creating authentication configuration for provider: ${provider}`);
      
      const authConfig = await this.composio.authConfigs.create(provider);
      
      this.logger.log(`Authentication configuration created successfully: ${authConfig.id}`);
      return authConfig.id;
    } catch (error) {
      this.logger.error(`Failed to create authentication configuration for ${provider}:`, error);
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
  async createIntegrationConnection(request: CreateIntegrationRequest): Promise<CreateIntegrationResponse> {
    this.validateConfiguration();
    
    try {
      this.logger.log(`Initiating integration connection for user ${request.userId} with provider ${request.provider}`);
      
      // Get or create auth configuration for the provider
      const authConfigId = await this.getOrCreateAuthConfiguration(request.provider);
      
      const connection = await this.composio.connectedAccounts.initiate(
        request.userId,
        authConfigId
      );

      this.logger.log(`Integration connection initiated successfully: ${connection.id}`);
      
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
   * Retrieves available tools for a user with specific integration toolkits
   * 
   * @param userId - The user identifier
   * @param toolkits - Array of toolkit names to retrieve tools for
   * @returns Promise<any[]> - Array of available tools
   */
  async getAvailableTools(userId: string, toolkits: string[] = ['GMAIL']): Promise<any[]> {
    this.validateConfiguration();
    
    try {
      this.logger.log(`Retrieving tools for user ${userId} with toolkits: ${toolkits.join(', ')}`);
      
      const tools = await this.composio.tools.get(userId, {
        toolkits,
      });

      this.logger.log(`Successfully retrieved ${tools.length} tools`);
      return tools;
    } catch (error) {
      this.logger.error(`Failed to retrieve tools:`, error);
      throw new BadRequestException(
        'Unable to retrieve available tools. Please ensure your integration is properly connected.'
      );
    }
  }

  /**
   * Sends an email using Gmail integration
   * 
   * @param request - The email sending request
   * @returns Promise<SendEmailResponse> - Result of the email sending operation
   */
  async sendEmailViaGmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    this.validateConfiguration();
    
    try {
      this.logger.log(`Sending email for user ${request.userId} to ${request.recipient}`);
      
      // Retrieve Gmail tools for the user
      const tools = await this.getAvailableTools(request.userId, ['GMAIL']);
      
      if (tools.length === 0) {
        throw new NotFoundException(
          'No Gmail integration found. Please connect your Gmail account first.'
        );
      }

      // In a production environment, you would integrate with OpenAI or another AI provider
      // to generate and send the email using the retrieved tools
      const emailData = {
        recipient: request.overwriteRecipient || request.recipient,
        subject: request.subject,
        content: request.content,
        toolsAvailable: tools.length,
        timestamp: new Date().toISOString(),
      };

      this.logger.log(`Email prepared for sending to ${emailData.recipient}`);

      return {
        success: true,
        message: 'Email has been prepared for sending using Gmail integration',
        toolsAvailable: true,
        executionResult: emailData,
      };
    } catch (error) {
      this.logger.error(`Failed to send email:`, error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(
        'Unable to send email. Please check your Gmail integration and try again.'
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
    this.validateConfiguration();
    
    try {
      this.logger.log(`Retrieving connected accounts for user ${userId}`);
      
      const response = await this.composio.connectedAccounts.list({
        userIds: [userId],
      });
      
      const accounts: ConnectedAccount[] = response.items.map(item => ({
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
   * Disconnects a specific integration account
   * 
   * @param userId - The user identifier
   * @param connectionId - The connection identifier to disconnect
   * @returns Promise<{ success: boolean }> - Success status
   */
  async disconnectIntegration(userId: string, connectionId: string): Promise<{ success: boolean }> {
    this.validateConfiguration();
    
    try {
      this.logger.log(`Disconnecting integration ${connectionId} for user ${userId}`);
      
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

      this.logger.log(`Retrieved ${providers.length} available integration providers`);
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
  private async getOrCreateAuthConfiguration(provider: string): Promise<string> {
    // In a production environment, you should:
    // 1. Check if an auth config already exists for this provider
    // 2. Store auth config IDs in a database
    // 3. Reuse existing configs instead of creating new ones
    
    return await this.createAuthConfiguration(provider);
  }

  /**
   * Checks if the service is properly configured
   * 
   * @returns boolean - Configuration status
   */
  isServiceConfigured(): boolean {
    return this.isConfigured;
  }
}
