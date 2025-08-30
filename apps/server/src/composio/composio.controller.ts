import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ComposioService } from './composio.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  InitiateConnectionDto,
  WaitForConnectionDto,
  ExecuteToolDto,
  ListAuthConfigsDto,
  CreateAuthConfigDto,
  UpdateAuthConfigDto,
  EnhancedInitiateConnectionDto,
} from '../dto/composio.dto';

@Controller('composio')
@UseGuards(JwtAuthGuard)
export class ComposioController {
  constructor(private readonly composioService: ComposioService) {}

  @Get('status')
  getStatus() {
    return {
      configured: this.composioService.isConfigured(),
      status: this.composioService.isConfigured() ? 'ready' : 'not_configured',
    };
  }

  @Post('connections/initiate')
  @HttpCode(HttpStatus.OK)
  async initiateConnection(
    @Request() req,
    @Body() initiateConnectionDto: InitiateConnectionDto
  ) {
    const result = await this.composioService.initiateConnection(
      req.user.id,
      initiateConnectionDto.provider,
      initiateConnectionDto.callback_url,
      initiateConnectionDto.scope
    );

    if (!result) {
      throw new BadRequestException('Failed to initiate connection');
    }

    return result;
  }

  @Post('connections/wait')
  @HttpCode(HttpStatus.OK)
  async waitForConnection(@Body() waitForConnectionDto: WaitForConnectionDto) {
    const result = await this.composioService.waitForConnection(
      waitForConnectionDto.connection_id,
      waitForConnectionDto.timeout
    );

    if (!result) {
      throw new BadRequestException('Failed to wait for connection');
    }

    return result;
  }

  @Get('connections')
  async listConnectedAccounts(@Request() req) {
    return this.composioService.listConnectedAccounts(req.user.id);
  }

  @Get('connections/:accountId')
  async getConnectedAccount(@Param('accountId') accountId: string) {
    const result = await this.composioService.getConnectedAccount(accountId);

    if (!result) {
      throw new NotFoundException('Connected account not found');
    }

    return result;
  }

  @Put('connections/:accountId/enable')
  @HttpCode(HttpStatus.OK)
  async enableConnectedAccount(@Param('accountId') accountId: string) {
    const success = await this.composioService.enableConnectedAccount(
      accountId
    );

    if (!success) {
      throw new BadRequestException('Failed to enable connected account');
    }

    return { message: 'Connected account enabled successfully' };
  }

  @Put('connections/:accountId/disable')
  @HttpCode(HttpStatus.OK)
  async disableConnectedAccount(@Param('accountId') accountId: string) {
    const success = await this.composioService.disableConnectedAccount(
      accountId
    );

    if (!success) {
      throw new BadRequestException('Failed to disable connected account');
    }

    return { message: 'Connected account disabled successfully' };
  }

  @Put('connections/:accountId/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshConnectedAccount(@Param('accountId') accountId: string) {
    const success = await this.composioService.refreshConnectedAccount(
      accountId
    );

    if (!success) {
      throw new BadRequestException('Failed to refresh connected account');
    }

    return { message: 'Connected account refreshed successfully' };
  }

  @Delete('connections/:accountId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConnectedAccount(@Param('accountId') accountId: string) {
    const success = await this.composioService.deleteConnectedAccount(
      accountId
    );

    if (!success) {
      throw new BadRequestException('Failed to delete connected account');
    }
  }

  @Post('tools/execute')
  @HttpCode(HttpStatus.OK)
  async executeTool(@Request() req, @Body() executeToolDto: ExecuteToolDto) {
    const result = await this.composioService.executeTool(
      req.user.id,
      executeToolDto.action_name,
      executeToolDto.params || {},
      executeToolDto.connected_account_id
    );

    if (!result.success) {
      throw new BadRequestException(result.error || 'Failed to execute tool');
    }

    return result;
  }

  @Get('auth-configs')
  async listAuthConfigs(@Query() query: ListAuthConfigsDto) {
    const result = await this.composioService.listAuthConfigs(
      query.is_composio_managed,
      query.toolkit_slug,
      query.show_disabled || false,
      query.search,
      query.limit || 10,
      query.cursor
    );

    if (!result) {
      throw new BadRequestException('Failed to list auth configs');
    }

    return result;
  }

  @Post('auth-configs')
  @HttpCode(HttpStatus.CREATED)
  async createAuthConfig(@Body() createAuthConfigDto: CreateAuthConfigDto) {
    // Note: This would require implementing createAuthConfig in the service
    throw new BadRequestException('Create auth config not implemented yet');
  }

  @Put('auth-configs/:configId')
  @HttpCode(HttpStatus.OK)
  async updateAuthConfig(
    @Param('configId') configId: string,
    @Body() updateAuthConfigDto: UpdateAuthConfigDto
  ) {
    // Note: This would require implementing updateAuthConfig in the service
    throw new BadRequestException('Update auth config not implemented yet');
  }

  @Delete('auth-configs/:configId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAuthConfig(@Param('configId') configId: string) {
    // Note: This would require implementing deleteAuthConfig in the service
    throw new BadRequestException('Delete auth config not implemented yet');
  }

  @Get('toolkits')
  async getAvailableToolkits(
    @Query('search') search?: string,
    @Query('limit') limit?: number
  ) {
    return this.composioService.getAvailableToolkits(search, limit || 50);
  }

  @Get('toolkits/:toolkitSlug/actions')
  async getToolkitActions(
    @Param('toolkitSlug') toolkitSlug: string,
    @Query('limit') limit?: number
  ) {
    return this.composioService.getToolkitActions(toolkitSlug, limit || 50);
  }

  @Post('connections/enhanced-initiate')
  @HttpCode(HttpStatus.OK)
  async enhancedInitiateConnection(
    @Request() req,
    @Body() enhancedInitiateConnectionDto: EnhancedInitiateConnectionDto
  ) {
    const result = await this.composioService.enhancedInitiateConnection(
      req.user.id,
      enhancedInitiateConnectionDto.app_name,
      enhancedInitiateConnectionDto.auth_config_id,
      enhancedInitiateConnectionDto.redirect_url,
      enhancedInitiateConnectionDto.labels
    );

    if (!result) {
      throw new BadRequestException('Failed to initiate enhanced connection');
    }

    return result;
  }
}
