import {
  Integration,
  IntegrationStatusType,
  AuthType,
  Provider,
} from '@kronos/core';

export const AVAILABLE_INTEGRATIONS: Integration[] = [
  {
    id: Provider.WEB_RESEARCH,
    name: 'Web Research',
    description:
      'Search and research information from the web through advanced web search capabilities',
    category: 'research',
    status: IntegrationStatusType.AVAILABLE,
    capabilities: ['web_search', 'real_time_research', 'information_gathering'],
    authType: AuthType.NOT_NEEDED,
  },
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
    description:
      'Manage repositories, issues, and pull requests through Github integration',
    category: 'development',
    status: IntegrationStatusType.AVAILABLE,
    capabilities: [
      'manage_repositories',
      'manage_issues',
      'manage_pull_requests',
    ],
    authType: AuthType.OAUTH,
  },
  {
    id: Provider.NOTION,
    name: 'Notion',
    description:
      'Create and manage Notion pages and databases through Notion integration',
    category: 'productivity',
    status: IntegrationStatusType.AVAILABLE,
    capabilities: ['manage_pages', 'manage_databases'],
    authType: AuthType.OAUTH,
  },
  {
    id: Provider.SLACK,
    name: 'Slack',
    description:
      'Send messages and manage Slack channels through Slack integration',
    category: 'communication',
    status: IntegrationStatusType.AVAILABLE,
    capabilities: ['send_messages', 'manage_channels'],
    authType: AuthType.OAUTH,
  },
  {
    id: Provider.TWITTER,
    name: 'X (Twitter)',
    description:
      'Manage X (Twitter) accounts and tweets through X (Twitter) integration',
    category: 'communication',
    status: IntegrationStatusType.AVAILABLE,
    capabilities: ['manage_tweets', 'manage_accounts'],
    authType: AuthType.OAUTH,
  },
  {
    id: Provider.LINKEDIN,
    name: 'LinkedIn',
    description:
      'Manage LinkedIn accounts and posts through LinkedIn integration',
    category: 'communication',
    status: IntegrationStatusType.AVAILABLE,
    capabilities: ['manage_posts', 'manage_accounts'],
    authType: AuthType.OAUTH,
  },
  {
    id: Provider.REDDIT,
    name: 'Reddit',
    description: 'Manage Reddit accounts and posts through Reddit integration',
    category: 'communication',
    status: IntegrationStatusType.AVAILABLE,
    capabilities: ['manage_posts', 'manage_accounts'],
    authType: AuthType.OAUTH,
  },
  {
    id: Provider.GOOGLE_DRIVE,
    name: 'Google Drive',
    description:
      'Manage Google Drive files and folders through Google Drive integration',
    category: 'storage',
    status: IntegrationStatusType.AVAILABLE,
    capabilities: ['manage_files', 'manage_folders'],
    authType: AuthType.OAUTH,
  },
  {
    id: Provider.GOOGLE_CALENDAR,
    name: 'Google Calendar',
    description:
      'Manage Google Calendar events and scheduling through Google Calendar integration',
    category: 'calendar',
    status: IntegrationStatusType.AVAILABLE,
    capabilities: ['manage_events', 'manage_scheduling'],
    authType: AuthType.OAUTH,
  },

  {
    id: Provider.INSTAGRAM,
    name: 'Instagram',
    description:
      'Manage Instagram accounts and posts through Instagram integration',
    category: 'communication',
    status: IntegrationStatusType.AVAILABLE,
    capabilities: ['manage_posts', 'manage_accounts'],
    authType: AuthType.OAUTH,
  },
];
