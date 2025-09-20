import { KronosAgentBuilder } from './builder';
import { CheckpointerService } from '../../checkpointer';
import { ComposioIntegrationsService } from '../../composio/composio-integrations.service';
import { StateGraph } from '@langchain/langgraph';

export class KronosAgent {
  private userId: string;
  private checkpointerService: CheckpointerService;
  private toolProviderService: ComposioIntegrationsService;

  constructor(
    userId: string,
    checkpointerService: CheckpointerService,
    toolProviderService: ComposioIntegrationsService
  ) {
    this.userId = userId;
    this.checkpointerService = checkpointerService;
    this.toolProviderService = toolProviderService;
  }

  async getCompiledAgent(): Promise<ReturnType<StateGraph<any>['compile']>> {
    const compiledAgent = await new KronosAgentBuilder(
      this.userId,
      this.checkpointerService,
      this.toolProviderService
    ).build();

    return compiledAgent;
  }
}
