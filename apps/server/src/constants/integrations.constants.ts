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
    capabilities: [
      'Search the web for real-time information',
      'Access current news and data',
      'Research topics and trends',
      'Find public information'
    ],
    authType: AuthType.NOT_NEEDED,
  },
  {
    id: Provider.GMAIL,
    name: 'Gmail',
    description: 'Send and manage emails through Gmail integration',
    category: 'communication',
    status: IntegrationStatusType.AVAILABLE,
    capabilities: [
      'Read and search emails',
      'Send new emails and replies',
      'Manage email drafts',
      'Access email threads',
      'Get Gmail profile information'
    ],
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
      'Read and search repositories',
      'Create and manage issues',
      'Review pull requests',
      'Access commit history',
      'Manage branches and tags',
      'Create forks and commits',
      'Compare commits and branches'
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
    capabilities: [
      'Search and read Notion pages',
      'Access and manage databases',
      'Retrieve page content and metadata'
    ],
    authType: AuthType.OAUTH,
  },
  {
    id: Provider.SLACK,
    name: 'Slack',
    description:
      'Send messages and manage Slack channels through Slack integration',
    category: 'communication',
    status: IntegrationStatusType.AVAILABLE,
    capabilities: [
      'Send messages to channels',
      'Search and read messages',
      'Manage channels and users',
      'Find users and channels',
      'Create new channels',
      'Access workspace information'
    ],
    authType: AuthType.OAUTH,
  },
  {
    id: Provider.TWITTER,
    name: 'X (Twitter)',
    description:
      'Manage X (Twitter) accounts and tweets through X (Twitter) integration',
    category: 'communication',
    status: IntegrationStatusType.AVAILABLE,
    capabilities: [
      'Search recent tweets and content',
      'Access Twitter data and trends'
    ],
    authType: AuthType.OAUTH,
  },
  {
    id: Provider.LINKEDIN,
    name: 'LinkedIn',
    description:
      'Manage LinkedIn accounts and posts through LinkedIn integration',
    category: 'communication',
    status: IntegrationStatusType.COMING_SOON,
    capabilities: [
      'Access LinkedIn profile information',
      'Manage professional content'
    ],
    authType: AuthType.OAUTH,
  },
  {
    id: Provider.REDDIT,
    name: 'Reddit',
    description: 'Manage Reddit accounts and posts through Reddit integration',
    category: 'communication',
    status: IntegrationStatusType.AVAILABLE,
    capabilities: [
      'Read posts and comments',
      'Search across subreddits',
      'Access Reddit content and discussions'
    ],
    authType: AuthType.OAUTH,
  },
  {
    id: Provider.GOOGLE_DRIVE,
    name: 'Google Drive',
    description:
      'Manage Google Drive files and folders through Google Drive integration',
    category: 'storage',
    status: IntegrationStatusType.AVAILABLE,
    capabilities: [
      'Create files from text',
      'Create and manage folders',
      'Access file metadata'
    ],
    authType: AuthType.OAUTH,
  },
  {
    id: Provider.GOOGLE_CALENDAR,
    name: 'Google Calendar',
    description:
      'Manage Google Calendar events and scheduling through Google Calendar integration',
    category: 'calendar',
    status: IntegrationStatusType.AVAILABLE,
    capabilities: [
      'View and search calendar events',
      'Create new events',
      'Update existing events',
      'Manage event scheduling'
    ],
    authType: AuthType.OAUTH,
  },
  {
    id: Provider.INSTAGRAM,
    name: 'Instagram',
    description:
      'Manage Instagram accounts and posts through Instagram integration',
    category: 'communication',
    status: IntegrationStatusType.COMING_SOON,
    capabilities: [
      'Access user media and content',
      'View user insights and analytics',
      'Get user profile information'
    ],
    authType: AuthType.OAUTH,
  },
];
