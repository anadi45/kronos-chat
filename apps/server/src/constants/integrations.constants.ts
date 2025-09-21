import { Integration, IntegrationStatusType, AuthType, Provider } from '@kronos/core';

export const AVAILABLE_INTEGRATIONS: Integration[] = [
  {
    id: Provider.GMAIL,
    name: 'Gmail',
    description: 'Send and manage emails through Gmail integration',
    category: 'communication',
    status: IntegrationStatusType.AVAILABLE,
    capabilities: ['send_emails', 'read_emails', 'manage_labels'],
    authType: AuthType.OAUTH,
  },
];
