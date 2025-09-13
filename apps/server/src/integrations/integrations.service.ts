import { Injectable, Logger } from '@nestjs/common';
import { ComposioIntegrationsService } from '../composio/composio-integrations.service';

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

/**
 * Service for managing general integrations
 * Provides a unified interface for all integration types
 */
@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly composioService: ComposioIntegrationsService,
  ) {}

  /**
   * Get all available integrations
   */
  async getAvailableIntegrations(): Promise<Integration[]> {
    const integrations: Integration[] = [
      {
        id: 'slack',
        name: 'Slack',
        description: 'Connect Kronos to your Slack workspace for seamless team communication',
        icon: 'slack',
        category: 'communication',
        status: 'coming_soon',
        capabilities: ['send_messages', 'read_channels', 'manage_workspace'],
        authType: 'oauth',
      },
      {
        id: 'discord',
        name: 'Discord',
        description: 'Bring Kronos AI to your Discord server for community interactions',
        icon: 'discord',
        category: 'communication',
        status: 'coming_soon',
        capabilities: ['send_messages', 'read_channels', 'manage_server'],
        authType: 'oauth',
      },
      {
        id: 'github',
        name: 'GitHub',
        description: 'Integrate with GitHub for code assistance and repository management',
        icon: 'github',
        category: 'development',
        status: 'coming_soon',
        capabilities: ['read_repos', 'create_issues', 'manage_pull_requests'],
        authType: 'oauth',
      },
      {
        id: 'notion',
        name: 'Notion',
        description: 'Connect with Notion for document creation and knowledge management',
        icon: 'notion',
        category: 'productivity',
        status: 'coming_soon',
        capabilities: ['read_pages', 'create_pages', 'manage_database'],
        authType: 'oauth',
      },
      {
        id: 'gmail',
        name: 'Gmail',
        description: 'Send and manage emails through Gmail integration',
        icon: 'gmail',
        category: 'communication',
        status: 'available',
        capabilities: ['send_emails', 'read_emails', 'manage_labels'],
        authType: 'oauth',
      },
    ];

    return integrations;
  }

  /**
   * Get user's connected integrations
   */
  async getConnectedIntegrations(userId: string): Promise<Integration[]> {
    try {
      // Get connected accounts from Composio service
      const connectedAccounts = await this.composioService.getConnectedAccounts(userId);
      
      // Get all available integrations
      const allIntegrations = await this.getAvailableIntegrations();
      
      // Map connected accounts to integrations
      const connectedIntegrations = allIntegrations.map(integration => {
        const connectedAccount = connectedAccounts.find(
          account => account.provider.toLowerCase() === integration.id
        );
        
        if (connectedAccount) {
          return {
            ...integration,
            isConnected: true,
            connectedAt: connectedAccount.connectedAt,
            status: 'available' as const,
          };
        }
        
        return integration;
      });

      return connectedIntegrations;
    } catch (error) {
      this.logger.error(`Failed to get connected integrations for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get integration status and configuration
   */
  async getIntegrationStatus(): Promise<IntegrationStatus> {
    const isConfigured = this.composioService.isServiceConfigured();
    const integrations = await this.getAvailableIntegrations();
    
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
      // For now, delegate to Composio service for OAuth connections
      if (provider === 'gmail') {
        return await this.composioService.createIntegrationConnection({
          userId,
          provider: 'GMAIL',
        });
      }
      
      // For other integrations, return a placeholder response
      return {
        message: `${provider} integration is coming soon`,
        status: 'coming_soon',
        provider,
      };
    } catch (error) {
      this.logger.error(`Failed to connect integration ${provider} for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from a specific integration
   */
  async disconnectIntegration(userId: string, provider: string): Promise<{ success: boolean }> {
    try {
      // Get connected accounts to find the connection ID
      const connectedAccounts = await this.composioService.getConnectedAccounts(userId);
      const account = connectedAccounts.find(
        acc => acc.provider.toLowerCase() === provider
      );
      
      if (account) {
        await this.composioService.disconnectIntegration(userId, account.id);
        return { success: true };
      }
      
      return { success: false };
    } catch (error) {
      this.logger.error(`Failed to disconnect integration ${provider} for user ${userId}:`, error);
      return { success: false };
    }
  }

  /**
   * Get integration details and capabilities
   */
  async getIntegrationDetails(provider: string): Promise<Integration | null> {
    const integrations = await this.getAvailableIntegrations();
    return integrations.find(integration => integration.id === provider) || null;
  }
}
