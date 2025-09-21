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
import { OAuthIntegrationsService } from './oauth-integrations.service';

/**
 * Controller for managing OAuth integrations
 * Provides endpoints for OAuth connections, integration operations
 */
@Controller('oauth-integrations')
@UseGuards(JwtAuthGuard)
export class OAuthIntegrationsController {
  constructor(
    private readonly oauthIntegrationsService: OAuthIntegrationsService
  ) {}

  /**
   * Get all available integrations with connection status for the user
   *
   * @param req - Express request object containing user information
   * @returns Promise<any[]> - List of available integrations with connection status
   */
  @Get()
  async getAvailableIntegrations(@Request() req: any): Promise<any[]> {
    return this.oauthIntegrationsService.getAvailableIntegrations(req.user.id);
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
    return this.oauthIntegrationsService.connectIntegration(req.user.id, provider);
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
    return this.oauthIntegrationsService.disconnectIntegrationByProvider(req.user.id, provider);
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
    return this.oauthIntegrationsService.getIntegrationDetails(provider);
  }

  /**
   * Retrieves all available integration providers from Composio
   *
   * @returns Promise<any[]> - List of available providers
   */
  @Get('providers')
  async getAvailableProviders(): Promise<any[]> {
    return this.oauthIntegrationsService.getAvailableProviders();
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

    return this.oauthIntegrationsService.createIntegrationConnection({
      ...request,
      userId: req.user.id,
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
    return this.oauthIntegrationsService.getConnectedAccounts(req.user.id);
  }

  /**
   * Retrieves all OAuth integrations for the authenticated user
   *
   * @param req - Express request object containing user information
   * @returns Promise<any[]> - List of OAuth integrations
   */
  @Get('integrations')
  async getUserOAuthIntegrations(@Request() req: any): Promise<any[]> {
    return this.oauthIntegrationsService.getUserOAuthIntegrations(req.user.id);
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
    return this.oauthIntegrationsService.disconnectIntegration(req.user.id, connectionId);
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
    const authConfigId = await this.oauthIntegrationsService.createAuthConfiguration(
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
    const isConfigured = this.oauthIntegrationsService.isServiceConfigured();

    return {
      configured: isConfigured,
      message: isConfigured
        ? 'OAuth integration service is properly configured and ready to use'
        : 'OAuth integration service is not configured. Please check COMPOSIO_API_KEY environment variable',
    };
  }
}
