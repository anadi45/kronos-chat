import { KronosAgentBuilder } from './builder';
import { CheckpointerService } from '../../checkpointer';
import { StateGraph } from '@langchain/langgraph';

export class KronosAgent {
  private userId: string;
  private checkpointerService: CheckpointerService;

  constructor(userId: string, checkpointerService: CheckpointerService) {
    this.userId = userId;
    this.checkpointerService = checkpointerService;
  }

  async getCompiledAgent(): Promise<ReturnType<StateGraph<any>['compile']>> {
    const compiledAgent = await new KronosAgentBuilder(
      this.userId,
      this.checkpointerService
    ).build();

    return compiledAgent;
  }
}
