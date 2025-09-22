// Subagents exports
export { BaseSubagent } from './base-subagent';
export type { SubagentConfig } from './base-subagent';
export type { SubagentState, SubagentStateSchema } from './state';

// Integration-specific subagents
export { GmailSubagent } from './gmail-subagent';
export { GitHubSubagent } from './github-subagent';
export { NotionSubagent } from './notion-subagent';
export { SlackSubagent } from './slack-subagent';
export { TwitterSubagent } from './twitter-subagent';
export { LinkedInSubagent } from './linkedin-subagent';
export { RedditSubagent } from './reddit-subagent';
export { GoogleDriveSubagent } from './googledrive-subagent';
export { GoogleCalendarSubagent } from './googlecalendar-subagent';
export { InstagramSubagent } from './instagram-subagent';

// Subagent factory for creating subagents based on provider
import { Provider } from '@kronos/core';
import { CheckpointerService } from '../checkpointer';
import { ToolsExecutorService } from '../tools/tools-executor.service';
import { ToolsProviderService } from '../tools/tools-provider.service';
import { GmailSubagent } from './gmail-subagent';
import { GitHubSubagent } from './github-subagent';
import { NotionSubagent } from './notion-subagent';
import { SlackSubagent } from './slack-subagent';
import { TwitterSubagent } from './twitter-subagent';
import { LinkedInSubagent } from './linkedin-subagent';
import { RedditSubagent } from './reddit-subagent';
import { GoogleDriveSubagent } from './googledrive-subagent';
import { GoogleCalendarSubagent } from './googlecalendar-subagent';
import { InstagramSubagent } from './instagram-subagent';
import { WebResearchSubagent } from './web-research-subagent';

export class SubagentFactory {
  constructor(
    private checkpointerService: CheckpointerService,
    private toolsExecutorService: ToolsExecutorService,
    private toolsProviderService: ToolsProviderService
  ) {}

  createSubagent(provider: Provider, userId: string) {
    const config = {
      userId,
      checkpointerService: this.checkpointerService,
      toolsExecutorService: this.toolsExecutorService,
      toolsProviderService: this.toolsProviderService,
      provider,
    };

    switch (provider) {
      case Provider.GMAIL:
        return new GmailSubagent(config);
      case Provider.GITHUB:
        return new GitHubSubagent(config);
      case Provider.NOTION:
        return new NotionSubagent(config);
      case Provider.SLACK:
        return new SlackSubagent(config);
      case Provider.TWITTER:
        return new TwitterSubagent(config);
      case Provider.LINKEDIN:
        return new LinkedInSubagent(config);
      case Provider.REDDIT:
        return new RedditSubagent(config);
      case Provider.GOOGLE_DRIVE:
        return new GoogleDriveSubagent(config);
      case Provider.GOOGLE_CALENDAR:
        return new GoogleCalendarSubagent(config);
      case Provider.INSTAGRAM:
        return new InstagramSubagent(config);
      case Provider.WEB_RESEARCH:
        return new WebResearchSubagent(config);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}
