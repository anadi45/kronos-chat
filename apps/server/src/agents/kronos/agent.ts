import { KronosAgentBuilder } from './builder';
import { CheckpointerService } from '../../checkpointer';

export class KronosAgent {
  private userId: string;
  private checkpointerService: CheckpointerService;

  constructor(userId: string, checkpointerService: CheckpointerService) {
    this.userId = userId;
    this.checkpointerService = checkpointerService;
  }

  getCompiledAgent() {
    return new KronosAgentBuilder(
      this.userId,
      this.checkpointerService
    ).build();
  }
}
