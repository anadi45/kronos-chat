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
  {
    id: Provider.GITHUB,
    name: 'Github',
    description: 'Manage repositories, issues, and pull requests through Github integration',
    category: 'development',
    status: IntegrationStatusType.AVAILABLE,
    capabilities: ['manage_repositories', 'manage_issues', 'manage_pull_requests'],
    authType: AuthType.OAUTH,
  }
];
