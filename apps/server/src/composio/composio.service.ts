import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ConnectedAccount,
  ConnectionRequest,
  AuthConfig,
  Toolkit,
  ToolkitAction,
} from '@kronos/shared-types';

@Injectable()
export class ComposioService {
  private readonly logger = new Logger(ComposioService.name);
  private client: any;
  private initialized = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    try {
      const apiKey = this.configService.get<string>('COMPOSIO_API_KEY');
      const baseUrl = this.configService.get<string>(
        'COMPOSIO_BASE_URL',
        'https://backend.composio.dev'
      );

      if (!apiKey) {
        this.logger.warn(
          'Composio API key not configured. Set COMPOSIO_API_KEY environment variable.'
        );
        return;
      }

      // Dynamically import the composio package
      const composio = await import('composio');

      this.client = new composio.Composio({
        apiKey,
        baseUrl,
      });

      this.initialized = true;
      this.logger.log('Composio client initialized successfully');
    } catch (error) {
      this.logger.error(
        `Failed to initialize Composio client: ${error.message}`
      );
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Composio service not initialized');
    }
  }

  async initiateConnection(
    userId: string,
    provider: string,
    callbackUrl?: string,
    scope?: string[]
  ): Promise<ConnectionRequest | null> {
    this.ensureInitialized();

    try {
      const connectionRequest = await this.client.connectedAccounts.create({
        user_id: userId,
        app_name: provider,
        redirect_url: callbackUrl,
        scope: scope || [],
      });

      this.logger.log(
        `Connection initiated for user ${userId} with ${provider}`
      );

      return {
        connectionId: connectionRequest.id,
        redirectUrl: connectionRequest.redirectUrl,
        status: 'initiated',
      };
    } catch (error) {
      this.logger.error(`Failed to initiate connection: ${error.message}`);
      return null;
    }
  }

  async waitForConnection(
    connectionId: string,
    timeout: number = 60
  ): Promise<ConnectedAccount | null> {
    this.ensureInitialized();

    try {
      const connectedAccount = await this.client.connectedAccounts.wait({
        connection_id: connectionId,
        timeout,
      });

      return {
        accountId: connectedAccount.id,
        status: connectedAccount.status,
        provider: connectedAccount.appName || '',
        createdAt: connectedAccount.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to wait for connection: ${error.message}`);
      return null;
    }
  }

  async listConnectedAccounts(userId: string): Promise<ConnectedAccount[]> {
    this.ensureInitialized();

    try {
      const response = await this.client.connectedAccounts.get({
        user_id: userId,
      });
      const accounts = Array.isArray(response)
        ? response
        : response.items || [];

      return accounts.map((account: any) => ({
        accountId: account.id,
        status: account.status,
        provider: account.appName || '',
        createdAt: account.createdAt,
      }));
    } catch (error) {
      this.logger.error(`Failed to list connected accounts: ${error.message}`);
      return [];
    }
  }

  async getConnectedAccount(
    accountId: string
  ): Promise<ConnectedAccount | null> {
    this.ensureInitialized();

    try {
      const account = await this.client.connectedAccounts.getById({
        account_id: accountId,
      });

      return {
        accountId: account.id,
        status: account.status,
        provider: account.appName || '',
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to get connected account: ${error.message}`);
      return null;
    }
  }

  async enableConnectedAccount(accountId: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      await this.client.connectedAccounts.enable({ account_id: accountId });
      return true;
    } catch (error) {
      this.logger.error(`Failed to enable connected account: ${error.message}`);
      return false;
    }
  }

  async disableConnectedAccount(accountId: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      await this.client.connectedAccounts.disable({ account_id: accountId });
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to disable connected account: ${error.message}`
      );
      return false;
    }
  }

  async refreshConnectedAccount(accountId: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      await this.client.connectedAccounts.refresh({ account_id: accountId });
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to refresh connected account: ${error.message}`
      );
      return false;
    }
  }

  async deleteConnectedAccount(accountId: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      await this.client.connectedAccounts.delete({ account_id: accountId });
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete connected account: ${error.message}`);
      return false;
    }
  }

  async executeTool(
    userId: string,
    actionName: string,
    params: Record<string, any>,
    connectedAccountId?: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    this.ensureInitialized();

    try {
      const result = await this.client.actions.execute({
        action_name: actionName,
        params,
        entity_id: userId,
        connected_account_id: connectedAccountId,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to execute tool: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async listAuthConfigs(
    isComposioManaged?: boolean,
    toolkitSlug?: string,
    showDisabled: boolean = false,
    search?: string,
    limit: number = 10,
    cursor?: string
  ): Promise<{
    items: AuthConfig[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
    nextCursor?: string;
  } | null> {
    this.ensureInitialized();

    try {
      const params: any = {};
      if (isComposioManaged !== undefined) {
        params.is_composio_managed = isComposioManaged.toString();
      }
      if (toolkitSlug) params.toolkit_slug = toolkitSlug;
      if (showDisabled) params.show_disabled = 'true';
      if (search) params.search = search;
      if (limit) params.limit = limit;
      if (cursor) params.cursor = cursor;

      const authConfigs = await this.client.authConfigs.list(params);

      return {
        items: authConfigs.items || authConfigs,
        totalPages: authConfigs.total_pages || 1,
        currentPage: authConfigs.current_page || 1,
        totalItems: authConfigs.total_items || 0,
        nextCursor: authConfigs.next_cursor,
      };
    } catch (error) {
      this.logger.error(`Failed to list auth configs: ${error.message}`);
      return null;
    }
  }

  async getAvailableToolkits(
    search?: string,
    limit: number = 50
  ): Promise<Toolkit[]> {
    this.ensureInitialized();

    try {
      const params: any = {};
      if (search) params.search = search;
      if (limit) params.limit = limit;

      const toolkits = await this.client.apps.list(params);
      const toolkitItems = toolkits.items || toolkits;

      return toolkitItems.map((toolkit: any) => ({
        slug: toolkit.slug || '',
        name: toolkit.name || '',
        description: toolkit.description || '',
        logo: toolkit.logo || '',
        categories: toolkit.categories || [],
        authSchemes: toolkit.auth_schemes || [],
      }));
    } catch (error) {
      this.logger.error(`Failed to get available toolkits: ${error.message}`);
      return [];
    }
  }

  async getToolkitActions(
    toolkitSlug: string,
    limit: number = 50
  ): Promise<ToolkitAction[]> {
    this.ensureInitialized();

    try {
      const actions = await this.client.actions.list({
        app_name: toolkitSlug,
        limit,
      });

      const actionItems = actions.items || actions;

      return actionItems.map((action: any) => ({
        name: action.name || '',
        displayName: action.display_name || '',
        description: action.description || '',
        parameters: action.parameters || {},
        response: action.response || {},
        appName: action.app_name || toolkitSlug,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get toolkit actions for ${toolkitSlug}: ${error.message}`
      );
      return [];
    }
  }

  async enhancedInitiateConnection(
    userId: string,
    appName: string,
    authConfigId?: string,
    redirectUrl?: string,
    labels?: string[]
  ): Promise<ConnectionRequest | null> {
    this.ensureInitialized();

    try {
      const connectionData: any = {
        user_uuid: userId,
        app_name: appName,
      };

      if (authConfigId) connectionData.auth_config = authConfigId;
      if (redirectUrl) connectionData.redirect_url = redirectUrl;
      if (labels) connectionData.labels = labels;

      const connection = await this.client.connectedAccounts.create(
        connectionData
      );

      return {
        connectionId: connection.id,
        redirectUrl: connection.redirectUrl || '',
        status: connection.connectionStatus || 'initiated',
      };
    } catch (error) {
      this.logger.error(
        `Failed to initiate enhanced connection: ${error.message}`
      );
      return null;
    }
  }

  isConfigured(): boolean {
    return (
      this.initialized && !!this.configService.get<string>('COMPOSIO_API_KEY')
    );
  }
}
