import { KronosAgentBuilder } from './builder';
import { CheckpointerService } from '../../checkpointer';
import { ToolsExecutorService } from '../../tools/tools-executor.service';
import { ToolsProviderService } from '../../tools/tools-provider.service';
import { StateGraph } from '@langchain/langgraph';

export class KronosAgent {
  private userId: string;
  private checkpointerService: CheckpointerService;
  private toolsExecutorService: ToolsExecutorService;
  private toolsProviderService: ToolsProviderService;

  constructor(
    userId: string,
    checkpointerService: CheckpointerService,
    toolsExecutorService: ToolsExecutorService,
    toolsProviderService: ToolsProviderService
  ) {
    this.userId = userId;
    this.checkpointerService = checkpointerService;
    this.toolsExecutorService = toolsExecutorService;
    this.toolsProviderService = toolsProviderService;
  }

  async getCompiledAgent(): Promise<ReturnType<StateGraph<any>['compile']>> {
    const compiledAgent = await new KronosAgentBuilder(
      this.userId,
      this.checkpointerService,
      this.toolsExecutorService,
      this.toolsProviderService
    ).build();

    return compiledAgent;
  }
}
