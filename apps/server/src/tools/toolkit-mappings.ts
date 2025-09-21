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
    'gmail_send_email',
    'gmail_read_emails',
    'gmail_get_email',
    'gmail_reply_to_email',
    'gmail_forward_email',
    'gmail_create_draft',
    'gmail_send_draft',
    'gmail_search_emails',
    'gmail_get_labels',
    'gmail_create_label',
    'gmail_apply_label',
    'gmail_remove_label',
    'gmail_mark_as_read',
    'gmail_mark_as_unread',
    'gmail_archive_email',
    'gmail_unarchive_email',
    'gmail_delete_email',
    'gmail_restore_email'
  ],

  // GitHub Integration Tools
  [Provider.GITHUB]: [
    'github_create_repository',
    'github_get_repository',
    'github_list_repositories',
    'github_create_issue',
    'github_get_issue',
    'github_list_issues',
    'github_update_issue',
    'github_close_issue',
    'github_create_pull_request',
    'github_get_pull_request',
    'github_list_pull_requests',
    'github_merge_pull_request',
    'github_create_branch',
    'github_get_branch',
    'github_list_branches',
    'github_create_commit',
    'github_get_commit',
    'github_list_commits',
    'github_create_file',
    'github_update_file',
    'github_delete_file',
    'github_get_file_contents',
    'github_list_files',
    'github_create_webhook',
    'github_list_webhooks',
    'github_delete_webhook'
  ],

  // Notion Integration Tools
  [Provider.NOTION]: [
    'notion_create_page',
    'notion_get_page',
    'notion_update_page',
    'notion_delete_page',
    'notion_search_pages',
    'notion_create_database',
    'notion_get_database',
    'notion_query_database',
    'notion_create_database_item',
    'notion_get_database_item',
    'notion_update_database_item',
    'notion_delete_database_item',
    'notion_create_comment',
    'notion_get_comments',
    'notion_create_user',
    'notion_get_user',
    'notion_list_users'
  ],

  // Slack Integration Tools
  [Provider.SLACK]: [
    'slack_send_message',
    'slack_get_message',
    'slack_update_message',
    'slack_delete_message',
    'slack_create_channel',
    'slack_get_channel',
    'slack_list_channels',
    'slack_join_channel',
    'slack_leave_channel',
    'slack_invite_to_channel',
    'slack_create_direct_message',
    'slack_get_user',
    'slack_list_users',
    'slack_create_reminder',
    'slack_get_reminders',
    'slack_create_file_upload',
    'slack_get_file',
    'slack_list_files',
    'slack_create_reaction',
    'slack_get_reactions',
    'slack_remove_reaction'
  ],

  // Twitter/X Integration Tools
  [Provider.TWITTER]: [
    'twitter_create_tweet',
    'twitter_get_tweet',
    'twitter_delete_tweet',
    'twitter_retweet',
    'twitter_unretweet',
    'twitter_like_tweet',
    'twitter_unlike_tweet',
    'twitter_get_timeline',
    'twitter_get_user_tweets',
    'twitter_search_tweets',
    'twitter_follow_user',
    'twitter_unfollow_user',
    'twitter_get_followers',
    'twitter_get_following',
    'twitter_get_user_info',
    'twitter_create_list',
    'twitter_get_list',
    'twitter_add_to_list',
    'twitter_remove_from_list',
    'twitter_get_list_tweets'
  ],

  // LinkedIn Integration Tools
  [Provider.LINKEDIN]: [
    'linkedin_create_post',
    'linkedin_get_post',
    'linkedin_update_post',
    'linkedin_delete_post',
    'linkedin_get_feed',
    'linkedin_like_post',
    'linkedin_unlike_post',
    'linkedin_comment_on_post',
    'linkedin_get_comments',
    'linkedin_share_post',
    'linkedin_get_profile',
    'linkedin_update_profile',
    'linkedin_get_connections',
    'linkedin_send_connection_request',
    'linkedin_accept_connection_request',
    'linkedin_get_company',
    'linkedin_create_company_post',
    'linkedin_get_company_posts'
  ],

  // Reddit Integration Tools
  [Provider.REDDIT]: [
    'reddit_create_post',
    'reddit_get_post',
    'reddit_update_post',
    'reddit_delete_post',
    'reddit_get_subreddit_posts',
    'reddit_search_posts',
    'reddit_upvote_post',
    'reddit_downvote_post',
    'reddit_remove_vote',
    'reddit_create_comment',
    'reddit_get_comment',
    'reddit_update_comment',
    'reddit_delete_comment',
    'reddit_get_post_comments',
    'reddit_subscribe_to_subreddit',
    'reddit_unsubscribe_from_subreddit',
    'reddit_get_subscribed_subreddits',
    'reddit_get_user_info',
    'reddit_get_user_posts',
    'reddit_get_user_comments'
  ],

  // Google Drive Integration Tools
  [Provider.GOOGLE_DRIVE]: [
    'googledrive_create_file',
    'googledrive_get_file',
    'googledrive_update_file',
    'googledrive_delete_file',
    'googledrive_copy_file',
    'googledrive_move_file',
    'googledrive_share_file',
    'googledrive_get_file_permissions',
    'googledrive_create_folder',
    'googledrive_get_folder',
    'googledrive_list_folder_contents',
    'googledrive_search_files',
    'googledrive_get_file_metadata',
    'googledrive_download_file',
    'googledrive_upload_file',
    'googledrive_create_shortcut',
    'googledrive_get_revisions',
    'googledrive_restore_revision'
  ],

  // Google Calendar Integration Tools
  [Provider.GOOGLE_CALENDAR]: [
    'googlecalendar_create_event',
    'googlecalendar_get_event',
    'googlecalendar_update_event',
    'googlecalendar_delete_event',
    'googlecalendar_list_events',
    'googlecalendar_search_events',
    'googlecalendar_create_calendar',
    'googlecalendar_get_calendar',
    'googlecalendar_update_calendar',
    'googlecalendar_delete_calendar',
    'googlecalendar_list_calendars',
    'googlecalendar_create_reminder',
    'googlecalendar_get_reminders',
    'googlecalendar_update_reminder',
    'googlecalendar_delete_reminder',
    'googlecalendar_get_availability',
    'googlecalendar_create_recurring_event',
    'googlecalendar_respond_to_event'
  ],

  // Instagram Integration Tools
  [Provider.INSTAGRAM]: [
    'instagram_create_post',
    'instagram_get_post',
    'instagram_update_post',
    'instagram_delete_post',
    'instagram_get_feed',
    'instagram_like_post',
    'instagram_unlike_post',
    'instagram_comment_on_post',
    'instagram_get_comments',
    'instagram_get_user_info',
    'instagram_get_user_posts',
    'instagram_follow_user',
    'instagram_unfollow_user',
    'instagram_get_followers',
    'instagram_get_following',
    'instagram_create_story',
    'instagram_get_story',
    'instagram_delete_story',
    'instagram_create_highlight',
    'instagram_get_highlights'
  ]
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
export function isToolSupportedByToolkit(toolkit: string, toolName: string): boolean {
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
    tools
  };
}
