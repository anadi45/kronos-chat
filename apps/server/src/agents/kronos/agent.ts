import { KronosAgentBuilder } from './builder';

export class KronosAgent {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  getCompiledAgent() {
    return new KronosAgentBuilder(this.userId).build();
  }
}
