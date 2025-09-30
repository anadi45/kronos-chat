import { IsEnum, IsString, IsUUID } from 'class-validator';
import { Provider } from '@quark/core';

export class ConnectIntegrationDto {
  @IsEnum(Provider, {
    message: `Provider must be one of: ${Object.values(Provider).join(', ')}`
  })
  provider: Provider;
}

export class DisconnectIntegrationDto {
  @IsEnum(Provider, {
    message: `Provider must be one of: ${Object.values(Provider).join(', ')}`
  })
  provider: Provider;
}

export class CreateIntegrationRequestDto {
  @IsUUID()
  userId: string;

  @IsEnum(Provider, {
    message: `Provider must be one of: ${Object.values(Provider).join(', ')}`
  })
  provider: Provider;
}
