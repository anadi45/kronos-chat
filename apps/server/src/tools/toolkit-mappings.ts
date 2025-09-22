import { Provider } from '@kronos/core';

/**
 * Toolkit to Tools Mapping
 *
 * This file defines which tools are available for each toolkit/provider.
 * This gives us control over what tools can be used for each integration.
 */

export interface ToolkitToolMapping {
  [key: string]: string[];
}

/**
 * Mapping of toolkits to their supported tool names
 *
 * Key: Provider enum value (e.g., 'GMAIL', 'GITHUB')
 * Value: Array of tool names that are available for that toolkit
 */
export const TOOLKIT_TOOLS_MAPPING: ToolkitToolMapping = {
  // Gmail Integration Tools
  [Provider.GMAIL]: [
    'GMAIL_CREATE_EMAIL_DRAFT',
    'GMAIL_REPLY_TO_THREAD',
    'GMAIL_SEND_EMAIL',
    'GMAIL_LIST_DRAFTS',
    'GMAIL_GET_PROFILE',
    'GMAIL_FETCH_MESSAGE_BY_THREAD_ID',
    'GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID',
    'GMAIL_DELETE_DRAFT',
    'GMAIL_FETCH_EMAILS',
  ],

  // GitHub Integration Tools
  [Provider.GITHUB]: [
    'GITHUB_LIST_REPOSITORIES_STARRED_BY_A_USER',
    'GITHUB_LIST_PULL_REQUESTS',
    'GITHUB_LIST_ORGANIZATIONS_FOR_A_USER',
    'GITHUB_LIST_ORGANIZATIONS',
    'GITHUB_LIST_FOLLOWERS_OF_A_USER',
    'GITHUB_LIST_COMMIT_COMMENTS_FOR_A_REPOSITORY',
    'GITHUB_LIST_COMMITS',
    'GITHUB_LIST_BRANCHES',
    'GITHUB_ISSUES_GET',
    'GITHUB_GET_A_USER',
    'GITHUB_GET_A_REPOSITORY_README',
    'GITHUB_GET_A_REPOSITORY',
    'GITHUB_GET_A_COMMIT',
    'GITHUB_GET_A_BRANCH',
    'GITHUB_FIND_REPOSITORIES',
    'GITHUB_FIND_PULL_REQUESTS',
    'GITHUB_CREATE_A_PULL_REQUEST',
    'GITHUB_CREATE_A_FORK',
    'GITHUB_CREATE_A_COMMIT_STATUS',
    'GITHUB_CREATE_A_COMMIT_COMMENT',
    'GITHUB_CREATE_A_COMMIT',
    'GITHUB_COMPARE_TWO_COMMITS',
    'GITHUB_CHECK_IF_A_PULL_REQUEST_HAS_BEEN_MERGED',
  ],

  // Notion Integration Tools
  [Provider.NOTION]: ['NOTION_SEARCH_NOTION_PAGE', 'NOTION_FETCH_DATA'],

  // Slack Integration Tools
  [Provider.SLACK]: [
    'SLACK_SEND_MESSAGE',
    'SLACK_SEND_EPHEMERAL_MESSAGE',
    'SLACK_SEARCH_MESSAGES',
    'SLACK_LIST_CONVERSATIONS',
    'SLACK_LIST_ALL_USERS',
    'SLACK_LIST_ALL_CHANNELS',
    'SLACK_FIND_USER_BY_EMAIL_ADDRESS',
    'SLACK_FIND_USERS',
    'SLACK_FIND_CHANNELS',
    'SLACK_CREATE_CHANNEL',
  ],

  // Twitter/X Integration Tools
  [Provider.TWITTER]: ['TWITTER_RECENT_SEARCH'],

  // LinkedIn Integration Tools
  [Provider.LINKEDIN]: ['LINKEDIN_GET_COMPANY_INFO', 'LINKEDIN_GET_MY_INFO'],

  // Reddit Integration Tools
  [Provider.REDDIT]: [
    'REDDIT_RETRIEVE_POST_COMMENTS',
    'REDDIT_RETRIEVE_REDDIT_POST',
    'REDDIT_SEARCH_ACROSS_SUBREDDITS',
  ],

  // Google Drive Integration Tools
  [Provider.GOOGLE_DRIVE]: [
    'GOOGLEDRIVE_CREATE_FILE_FROM_TEXT',
    'GOOGLEDRIVE_CREATE_FOLDER',
  ],

  // Google Calendar Integration Tools
  [Provider.GOOGLE_CALENDAR]: [
    'GOOGLECALENDAR_FIND_EVENT',
    'GOOGLECALENDAR_EVENTS_LIST',
  ],

  // Instagram Integration Tools
  [Provider.INSTAGRAM]: [
    'INSTAGRAM_GET_USER_MEDIA',
    'INSTAGRAM_GET_USER_INSIGHTS',
    'INSTAGRAM_GET_USER_INFO',
  ],
};

/**
 * Get supported tools for a specific toolkit
 *
 * @param toolkit - The toolkit/provider name
 * @returns Array of tool names for that toolkit
 */
export function getToolsForToolkit(toolkit: string): string[] {
  return TOOLKIT_TOOLS_MAPPING[toolkit] || [];
}

/**
 * Get all supported toolkits
 *
 * @returns Array of all toolkit names
 */
export function getAllToolkits(): string[] {
  return Object.keys(TOOLKIT_TOOLS_MAPPING);
}

/**
 * Get all tools for multiple toolkits
 *
 * @param toolkits - Array of toolkit names
 * @returns Array of all tool names for the specified toolkits
 */
export function getToolsForToolkits(toolkits: string[]): string[] {
  const allTools: string[] = [];

  for (const toolkit of toolkits) {
    const tools = getToolsForToolkit(toolkit);
    allTools.push(...tools);
  }

  return [...new Set(allTools)]; // Remove duplicates
}

/**
 * Check if a tool is supported by a toolkit
 *
 * @param toolkit - The toolkit name
 * @param toolName - The tool name to check
 * @returns True if the tool is supported by the toolkit
 */
export function isToolSupportedByToolkit(
  toolkit: string,
  toolName: string
): boolean {
  const tools = getToolsForToolkit(toolkit);
  return tools.includes(toolName);
}

/**
 * Get toolkit information including tool count
 *
 * @param toolkit - The toolkit name
 * @returns Object with toolkit info
 */
export function getToolkitInfo(toolkit: string): {
  toolkit: string;
  toolCount: number;
  tools: string[];
} {
  const tools = getToolsForToolkit(toolkit);
  return {
    toolkit,
    toolCount: tools.length,
    tools,
  };
}
