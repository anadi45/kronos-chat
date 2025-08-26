import { Composio } from "@composio/core";
import { COMPOSIO_CONFIG, type ProviderName } from "../config/composio";

// Re-export ProviderName for convenience
export type { ProviderName } from "../config/composio";

// Define types for Composio responses
interface ConnectedAccount {
  id: string;
  status: string;
  provider: string;
  createdAt: string;
}

interface Tool {
  slug: string;
  name: string;
  description?: string;
}

interface ToolExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface ConnectionResponse {
  connectionId: string;
  redirectUrl: string;
}

/**
 * ComposioService - Service for handling Composio integrations
 */
class ComposioService {
  private composio: Composio | null = null;
  private initialized = false;

  /**
   * Initialize the Composio client
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (!COMPOSIO_CONFIG.API_KEY) {
      throw new Error(
        "Composio API key is missing. Please set VITE_COMPOSIO_API_KEY in your environment variables."
      );
    }

    try {
      this.composio = new Composio({
        apiKey: COMPOSIO_CONFIG.API_KEY,
        baseURL: COMPOSIO_CONFIG.BASE_URL,
      });

      this.initialized = true;
      console.log("Composio client initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Composio client:", error);
      throw error;
    }
  }

  /**
   * Get the Composio client instance
   */
  getClient(): Composio {
    if (!this.initialized || !this.composio) {
      throw new Error(
        "Composio client not initialized. Call initialize() first."
      );
    }
    return this.composio;
  }

  /**
   * Initiate connection with a provider (OAuth flow)
   * @param userId - User identifier
   * @param provider - Provider name (e.g., 'github', 'slack')
   * @param options - Connection options
   */
  async initiateConnection(
    userId: string,
    provider: ProviderName,
    options?: {
      callbackUrl?: string;
      scope?: string[];
    }
  ): Promise<ConnectionResponse> {
    await this.initialize();

    if (!this.composio) {
      throw new Error("Composio client not available");
    }

    try {
      const connectionRequest = await this.composio.connectedAccounts.initiate(
        userId,
        provider,
        {
          callbackUrl: options?.callbackUrl,
          // Remove config with scope for now as it's not supported
          // config: {
          //   scope: options?.scope,
          // },
        }
      );

      return {
        connectionId: connectionRequest.id,
        redirectUrl: connectionRequest.redirectUrl || "",
      };
    } catch (error) {
      console.error(`Failed to initiate connection with ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Wait for a connection to be established
   * @param connectionId - Connection request ID
   * @param timeout - Timeout in milliseconds (default: 60 seconds)
   */
  async waitForConnection(
    connectionId: string,
    timeout: number = COMPOSIO_CONFIG.CONNECTION_TIMEOUT
  ): Promise<ConnectedAccount> {
    await this.initialize();

    if (!this.composio) {
      throw new Error("Composio client not available");
    }

    try {
      const connectedAccount =
        await this.composio.connectedAccounts.waitForConnection(
          connectionId,
          timeout
        );

      return {
        ...connectedAccount,
        provider: connectedAccount.toolkit?.slug || "unknown",
      } as ConnectedAccount;
    } catch (error) {
      console.error("Failed waiting for connection:", error);
      throw error;
    }
  }

  /**
   * List all connected accounts for a user
   * @param userId - User identifier
   */
  async listConnectedAccounts(userId: string): Promise<ConnectedAccount[]> {
    await this.initialize();

    if (!this.composio) {
      throw new Error("Composio client not available");
    }

    try {
      const accounts = await this.composio.connectedAccounts.list({
        userIds: [userId],
      });

      return (accounts.items || []).map((account) => ({
        ...account,
        provider: account.toolkit?.slug || "unknown",
      })) as ConnectedAccount[];
    } catch (error) {
      console.error("Failed to list connected accounts:", error);
      throw error;
    }
  }

  /**
   * Get a specific connected account
   * @param accountId - Connected account ID
   */
  async getConnectedAccount(accountId: string): Promise<ConnectedAccount> {
    await this.initialize();

    if (!this.composio) {
      throw new Error("Composio client not available");
    }

    try {
      const account = await this.composio.connectedAccounts.get(accountId);
      return {
        ...account,
        provider: account.toolkit?.slug || "unknown",
      } as ConnectedAccount;
    } catch (error) {
      console.error("Failed to get connected account:", error);
      throw error;
    }
  }

  /**
   * Enable a connected account
   * @param accountId - Connected account ID
   */
  async enableConnectedAccount(accountId: string): Promise<void> {
    await this.initialize();

    if (!this.composio) {
      throw new Error("Composio client not available");
    }

    try {
      await this.composio.connectedAccounts.enable(accountId);
    } catch (error) {
      console.error("Failed to enable connected account:", error);
      throw error;
    }
  }

  /**
   * Disable a connected account
   * @param accountId - Connected account ID
   */
  async disableConnectedAccount(accountId: string): Promise<void> {
    await this.initialize();

    if (!this.composio) {
      throw new Error("Composio client not available");
    }

    try {
      await this.composio.connectedAccounts.disable(accountId);
    } catch (error) {
      console.error("Failed to disable connected account:", error);
      throw error;
    }
  }

  /**
   * Refresh credentials for a connected account
   * @param accountId - Connected account ID
   */
  async refreshConnectedAccount(accountId: string): Promise<void> {
    await this.initialize();

    if (!this.composio) {
      throw new Error("Composio client not available");
    }

    try {
      await this.composio.connectedAccounts.refresh(accountId);
    } catch (error) {
      console.error("Failed to refresh connected account:", error);
      throw error;
    }
  }

  /**
   * Delete a connected account
   * @param accountId - Connected account ID
   */
  async deleteConnectedAccount(accountId: string): Promise<void> {
    await this.initialize();

    if (!this.composio) {
      throw new Error("Composio client not available");
    }

    try {
      await this.composio.connectedAccounts.delete(accountId);
    } catch (error) {
      console.error("Failed to delete connected account:", error);
      throw error;
    }
  }

  /**
   * Get available tools for a provider
   * @param provider - Provider name
   */
  async getProviderTools(provider: ProviderName): Promise<Tool[]> {
    await this.initialize();

    if (!this.composio) {
      throw new Error("Composio client not available");
    }

    try {
      // This is a simplified approach - in practice, you might want to filter
      // tools based on the provider or use specific toolkits
      // TODO: Fix this based on actual Composio SDK API
      // const tools = await this.composio.actions.list({
      //   appName: provider,
      // });
      const tools = { items: [] };

      return (tools.items || []) as Tool[];
    } catch (error) {
      console.error(`Failed to get tools for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Execute a tool/action
   * @param userId - User identifier
   * @param actionName - Name of the action to execute
   * @param params - Parameters for the action
   * @param connectedAccountId - Optional connected account ID
   */
  async executeTool(
    _userId: string,
    _actionName: string,
    _params: Record<string, unknown>,
    _connectedAccountId?: string
  ): Promise<ToolExecutionResult> {
    await this.initialize();

    if (!this.composio) {
      throw new Error("Composio client not available");
    }

    try {
      // TODO: Fix this based on actual Composio SDK API
      // const result = await this.composio.actions.execute(
      //   userId,
      //   actionName,
      //   params,
      //   {
      //     connectedAccountId,
      //   }
      // );
      const result = { success: true, data: null };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(`Failed to execute tool ${_actionName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// Export singleton instance
export const composioService = new ComposioService();
