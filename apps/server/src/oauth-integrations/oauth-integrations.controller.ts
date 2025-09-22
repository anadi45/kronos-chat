import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OAuthIntegrationsService } from './oauth-integrations.service';
import {
  Integration,
  ConnectIntegrationResponse,
  DisconnectIntegrationResponse,
} from '@kronos/core';
import {
  ConnectIntegrationDto,
  DisconnectIntegrationDto,
} from '../dto/integration.dto';

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
   * @returns Promise<Integration[]> - List of available integrations with connection status
   */
  @Get()
  async getAvailableIntegrations(@Request() req: any): Promise<Integration[]> {
    return this.oauthIntegrationsService.getAvailableIntegrations(req.user.id);
  }

  /**
   * Connect to a specific integration
   *
   * @param params - The integration provider parameters
   * @param req - Express request object containing user information
   * @returns Promise<ConnectIntegrationResponse> - Connection result
   */
  @Post(':provider/connect')
  async connectIntegration(
    @Param() params: ConnectIntegrationDto,
    @Request() req: any
  ): Promise<ConnectIntegrationResponse> {
    return this.oauthIntegrationsService.connectIntegration(
      req.user.id,
      params.provider
    );
  }

  /**
   * Disconnect from a specific integration
   *
   * @param params - The integration provider parameters
   * @param req - Express request object containing user information
   * @returns Promise<DisconnectIntegrationResponse> - Disconnection result
   */
  @Delete(':provider/disconnect')
  async disconnectIntegration(
    @Param() params: DisconnectIntegrationDto,
    @Request() req: any
  ): Promise<DisconnectIntegrationResponse> {
    return this.oauthIntegrationsService.disconnectIntegrationByProvider(
      req.user.id,
      params.provider
    );
  }
}
