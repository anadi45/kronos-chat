import { KronosAgentBuilder } from './builder';
import { CheckpointerService } from '../../checkpointer';

export class KronosAgent {
  private userId: string;
  private checkpointer: CheckpointerService;

  constructor(userId: string, checkpointer: CheckpointerService) {
    this.userId = userId;
    this.checkpointer = checkpointer;
  }

  getCompiledAgent() {
    return new KronosAgentBuilder(this.userId, this.checkpointer).build();
  }
}
