import { KronosAgentBuilder, KronosAgentConfig } from './builder';
import { CheckpointerService } from '../../checkpointer';
import { ToolsExecutorService } from '../../tools/tools-executor.service';
import { ToolsProviderService } from '../../tools/tools-provider.service';
import { StateGraph } from '@langchain/langgraph';
import { Provider } from '@kronos/core';

export class KronosAgent {
  private userId: string;
  private checkpointerService: CheckpointerService;
  private toolsExecutorService: ToolsExecutorService;
  private toolsProviderService: ToolsProviderService;
  private toolkits: Provider[];

  constructor({
    userId,
    checkpointerService,
    toolsExecutorService,
    toolsProviderService,
    toolkits,
  }: KronosAgentConfig) {
    this.userId = userId;
    this.checkpointerService = checkpointerService;
    this.toolsExecutorService = toolsExecutorService;
    this.toolsProviderService = toolsProviderService;
    this.toolkits = toolkits;
  }

  async getCompiledAgent(): Promise<ReturnType<StateGraph<any>['compile']>> {
    const compiledAgent = await new KronosAgentBuilder({
      userId: this.userId,
      checkpointerService: this.checkpointerService,
      toolsExecutorService: this.toolsExecutorService,
      toolsProviderService: this.toolsProviderService,
      toolkits: this.toolkits,
    }).build();

    return compiledAgent;
  }
}
