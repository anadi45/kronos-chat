import { Integration } from '../oauth-integrations/oauth-integrations.service';

/**
 * Available integrations configuration
 * This file contains the static list of all available integrations
 * and their configuration details.
 */
export const AVAILABLE_INTEGRATIONS: Integration[] = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Connect Kronos to your Slack workspace for seamless team communication',
    icon: 'slack',
    category: 'communication',
    status: 'coming_soon',
    capabilities: ['send_messages', 'read_channels', 'manage_workspace'],
    authType: 'oauth',
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Bring Kronos AI to your Discord server for community interactions',
    icon: 'discord',
    category: 'communication',
    status: 'coming_soon',
    capabilities: ['send_messages', 'read_channels', 'manage_server'],
    authType: 'oauth',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Integrate with GitHub for code assistance and repository management',
    icon: 'github',
    category: 'development',
    status: 'coming_soon',
    capabilities: ['read_repos', 'create_issues', 'manage_pull_requests'],
    authType: 'oauth',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Connect with Notion for document creation and knowledge management',
    icon: 'notion',
    category: 'productivity',
    status: 'coming_soon',
    capabilities: ['read_pages', 'create_pages', 'manage_database'],
    authType: 'oauth',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Send and manage emails through Gmail integration',
    icon: 'gmail',
    category: 'communication',
    status: 'available',
    capabilities: ['send_emails', 'read_emails', 'manage_labels'],
    authType: 'oauth',
  },
];

/**
 * Integration categories for filtering and organization
 */
export const INTEGRATION_CATEGORIES = {
  COMMUNICATION: 'communication',
  DEVELOPMENT: 'development',
  PRODUCTIVITY: 'productivity',
  ANALYTICS: 'analytics',
  MARKETING: 'marketing',
} as const;

/**
 * Integration status types
 */
export const INTEGRATION_STATUS = {
  AVAILABLE: 'available',
  COMING_SOON: 'coming_soon',
  BETA: 'beta',
} as const;

/**
 * Authentication types for integrations
 */
export const AUTH_TYPES = {
  OAUTH: 'oauth',
  API_KEY: 'api_key',
  WEBHOOK: 'webhook',
} as const;

/**
 * Common integration capabilities
 */
export const INTEGRATION_CAPABILITIES = {
  // Communication
  SEND_MESSAGES: 'send_messages',
  READ_MESSAGES: 'read_messages',
  READ_CHANNELS: 'read_channels',
  MANAGE_WORKSPACE: 'manage_workspace',
  MANAGE_SERVER: 'manage_server',
  
  // Email
  SEND_EMAILS: 'send_emails',
  READ_EMAILS: 'read_emails',
  MANAGE_LABELS: 'manage_labels',
  
  // Development
  READ_REPOS: 'read_repos',
  CREATE_ISSUES: 'create_issues',
  MANAGE_PULL_REQUESTS: 'manage_pull_requests',
  
  // Productivity
  READ_PAGES: 'read_pages',
  CREATE_PAGES: 'create_pages',
  UPDATE_PAGES: 'update_pages',
  MANAGE_DATABASE: 'manage_database',
} as const;
