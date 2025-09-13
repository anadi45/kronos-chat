import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ComposioIntegrationsService,
  CreateIntegrationRequest,
  CreateIntegrationResponse,
  SendEmailRequest,
  SendEmailResponse,
  IntegrationProvider,
  ConnectedAccount,
} from './composio-integrations.service';

/**
 * Professional controller for managing Composio integrations
 * Provides RESTful API endpoints for OAuth connections, tool management, and integration operations
 */
@Controller('composio')
@UseGuards(JwtAuthGuard)
export class ComposioIntegrationsController {
  constructor(
    private readonly composioService: ComposioIntegrationsService,
  ) {}

  /**
   * Retrieves all available integration providers
   * 
   * @returns Promise<IntegrationProvider[]> - List of available providers
   */
  @Get('providers')
  async getAvailableProviders(): Promise<IntegrationProvider[]> {
    return this.composioService.getAvailableProviders();
  }

  /**
   * Creates a new integration connection for the authenticated user
   * 
   * @param request - The integration connection request
   * @param req - Express request object containing user information
   * @returns Promise<CreateIntegrationResponse> - Connection details
   */
  @Post('connections')
  async createIntegrationConnection(
    @Body(ValidationPipe) request: Omit<CreateIntegrationRequest, 'userId'>,
    @Request() req: any,
  ): Promise<CreateIntegrationResponse> {
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
   * @returns Promise<ConnectedAccount[]> - List of connected accounts
   */
  @Get('connections')
  async getConnectedAccounts(@Request() req: any): Promise<ConnectedAccount[]> {
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
  async disconnectIntegration(
    @Param('connectionId') connectionId: string,
    @Request() req: any,
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
    @Query('toolkits') toolkits?: string,
  ): Promise<any[]> {
    const userId = req.user.id;
    const toolkitArray = toolkits ? toolkits.split(',') : ['GMAIL'];
    
    return this.composioService.getAvailableTools(userId, toolkitArray);
  }

  /**
   * Sends an email using Gmail integration
   * 
   * @param request - The email sending request
   * @param req - Express request object containing user information
   * @returns Promise<SendEmailResponse> - Email sending result
   */
  @Post('email/send')
  async sendEmail(
    @Body(ValidationPipe) request: Omit<SendEmailRequest, 'userId'>,
    @Request() req: any,
  ): Promise<SendEmailResponse> {
    const userId = req.user.id;
    
    return this.composioService.sendEmailViaGmail({
      ...request,
      userId,
    });
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
    @Param('provider') provider: string,
  ): Promise<{ provider: string; authConfigId: string; message: string }> {
    const authConfigId = await this.composioService.createAuthConfiguration(provider);
    
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
  @Get('status')
  async getServiceStatus(): Promise<{ configured: boolean; message: string }> {
    const isConfigured = this.composioService.isServiceConfigured();
    
    return {
      configured: isConfigured,
      message: isConfigured 
        ? 'Composio service is properly configured and ready to use'
        : 'Composio service is not configured. Please check COMPOSIO_API_KEY environment variable',
    };
  }
}
