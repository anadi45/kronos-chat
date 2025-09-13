import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IntegrationsService } from './integrations.service';
import { ComposioIntegrationsService } from '../composio/composio-integrations.service';

/**
 * Controller for managing all integrations
 * Provides unified endpoints for listing integrations, managing connections, and integration operations
 */
@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly composioService: ComposioIntegrationsService
  ) {}

  /**
   * Get all available integrations
   *
   * @returns Promise<any[]> - List of available integrations
   */
  @Get()
  async getAvailableIntegrations(): Promise<any[]> {
    return this.integrationsService.getAvailableIntegrations();
  }

  /**
   * Get user's connected integrations
   *
   * @param req - Express request object containing user information
   * @returns Promise<any[]> - List of user's connected integrations
   */
  @Get('connected')
  async getConnectedIntegrations(@Request() req: any): Promise<any[]> {
    return this.integrationsService.getConnectedIntegrations(req.user.id);
  }

  /**
   * Get integration status and configuration
   *
   * @returns Promise<{ configured: boolean; integrations: any[] }> - Integration status
   */
  @Get('status')
  async getIntegrationStatus(): Promise<{
    configured: boolean;
    integrations: any[];
  }> {
    return this.integrationsService.getIntegrationStatus();
  }

  /**
   * Connect to a specific integration
   *
   * @param provider - The integration provider identifier
   * @param req - Express request object containing user information
   * @returns Promise<any> - Connection result
   */
  @Post(':provider/connect')
  async connectIntegration(
    @Param('provider') provider: string,
    @Request() req: any
  ): Promise<any> {
    const userId = req.user.id;
    return this.integrationsService.connectIntegration(userId, provider);
  }

  /**
   * Disconnect from a specific integration
   *
   * @param provider - The integration provider identifier
   * @param req - Express request object containing user information
   * @returns Promise<{ success: boolean }> - Disconnection result
   */
  @Delete(':provider/disconnect')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disconnectIntegration(
    @Param('provider') provider: string,
    @Request() req: any
  ): Promise<{ success: boolean }> {
    const userId = req.user.id;
    return this.integrationsService.disconnectIntegration(userId, provider);
  }

  /**
   * Get integration details and capabilities
   *
   * @param provider - The integration provider identifier
   * @returns Promise<any> - Integration details
   */
  @Get(':provider')
  async getIntegrationDetails(
    @Param('provider') provider: string
  ): Promise<any> {
    return this.integrationsService.getIntegrationDetails(provider);
  }

  // Composio-specific endpoints (routed through integrations)

  /**
   * Retrieves all available integration providers from Composio
   *
   * @returns Promise<any[]> - List of available providers
   */
  @Get('providers')
  async getAvailableProviders(): Promise<any[]> {
    return this.composioService.getAvailableProviders();
  }

  /**
   * Creates a new integration connection for the authenticated user
   *
   * @param request - The integration connection request
   * @param req - Express request object containing user information
   * @returns Promise<any> - Connection details
   */
  @Post('connections')
  async createIntegrationConnection(
    @Body(ValidationPipe) request: any,
    @Request() req: any
  ): Promise<any> {
    const userId = req.user.id;

    return this.composioService.createIntegrationConnection({
      ...request,
      userId,
    });
  }

  /**
   * Retrieves all connected accounts for the authenticated user
   *
   * @param req - Express request object containing user information
   * @returns Promise<any[]> - List of connected accounts
   */
  @Get('connections')
  async getConnectedAccounts(@Request() req: any): Promise<any[]> {
    const userId = req.user.id;
    return this.composioService.getConnectedAccounts(userId);
  }

  /**
   * Disconnects a specific integration account
   *
   * @param connectionId - The connection identifier
   * @param req - Express request object containing user information
   * @returns Promise<{ success: boolean }> - Success status
   */
  @Delete('connections/:connectionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disconnectIntegrationConnection(
    @Param('connectionId') connectionId: string,
    @Request() req: any
  ): Promise<{ success: boolean }> {
    const userId = req.user.id;
    return this.composioService.disconnectIntegration(userId, connectionId);
  }

  /**
   * Retrieves available tools for the authenticated user
   *
   * @param req - Express request object containing user information
   * @param toolkits - Optional query parameter for specific toolkits
   * @returns Promise<any[]> - List of available tools
   */
  @Get('tools')
  async getAvailableTools(
    @Request() req: any,
    @Query('toolkits') toolkits?: string
  ): Promise<any[]> {
    const userId = req.user.id;
    const toolkitArray = toolkits ? toolkits.split(',') : ['GMAIL'];

    return this.composioService.getAvailableTools(userId, toolkitArray);
  }

  /**
   * Creates an authentication configuration for a specific provider
   * This is typically an admin operation and should be called once per provider
   *
   * @param provider - The provider name
   * @returns Promise<{ provider: string; authConfigId: string; message: string }> - Configuration details
   */
  @Post('auth-configs/:provider')
  async createAuthConfiguration(
    @Param('provider') provider: string
  ): Promise<{ provider: string; authConfigId: string; message: string }> {
    const authConfigId = await this.composioService.createAuthConfiguration(
      provider
    );

    return {
      provider,
      authConfigId,
      message: 'Authentication configuration created successfully',
    };
  }

  /**
   * Checks the service configuration status
   *
   * @returns Promise<{ configured: boolean; message: string }> - Configuration status
   */
  @Get('service/status')
  async getServiceStatus(): Promise<{ configured: boolean; message: string }> {
    const isConfigured = this.composioService.isServiceConfigured();

    return {
      configured: isConfigured,
      message: isConfigured
        ? 'Integration service is properly configured and ready to use'
        : 'Integration service is not configured. Please check COMPOSIO_API_KEY environment variable',
    };
  }
}
