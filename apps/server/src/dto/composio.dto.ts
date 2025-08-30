import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export class InitiateConnectionDto {
  @IsString()
  provider: string;

  @IsOptional()
  @IsString()
  callback_url?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scope?: string[];
}

export class WaitForConnectionDto {
  @IsString()
  connection_id: string;

  @IsOptional()
  @IsNumber()
  timeout?: number;
}

export class ExecuteToolDto {
  @IsString()
  action_name: string;

  @IsOptional()
  params?: Record<string, any>;

  @IsOptional()
  @IsString()
  connected_account_id?: string;
}

export class ListAuthConfigsDto {
  @IsOptional()
  @IsBoolean()
  is_composio_managed?: boolean;

  @IsOptional()
  @IsString()
  toolkit_slug?: string;

  @IsOptional()
  @IsBoolean()
  show_disabled?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;
}

export class CreateAuthConfigDto {
  @IsString()
  name: string;

  @IsString()
  toolkit_slug: string;

  @IsOptional()
  @IsString()
  auth_scheme?: string;

  @IsOptional()
  credentials?: Record<string, any>;

  @IsOptional()
  proxy_config?: Record<string, any>;
}

export class UpdateAuthConfigDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  credentials?: Record<string, any>;

  @IsOptional()
  proxy_config?: Record<string, any>;
}

export class EnhancedInitiateConnectionDto {
  @IsString()
  app_name: string;

  @IsOptional()
  @IsString()
  auth_config_id?: string;

  @IsOptional()
  @IsString()
  redirect_url?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];
}
