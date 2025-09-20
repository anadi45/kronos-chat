import { Tool } from '@langchain/core/tools';

/**
 * Signal Context Readiness Tool
 *
 * This tool should be called only after the agent has gathered all necessary information
 * to fully answer the user's query.
 */
class SignalContextReadinessTool extends Tool {
  name = 'signalContextReadiness';
  description =
    "Call this tool only after you have gathered all the necessary information to fully answer the user's query";

  async _call(): Promise<string> {
    console.log(`${this.name} tool was called`);
    return 'Context readiness signaled - agent has gathered all necessary information';
  }
}

export const signalContextReadinessTool = new SignalContextReadinessTool();
