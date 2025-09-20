import { RunnableConfig } from '@langchain/core/runnables';
import { KronosAgentState } from './state';

/**
 * Extract values from context.
 */
export function getContextValue(
  config: RunnableConfig,
  key: string
): string | undefined {
  // @ts-ignore
  return config.context[key];
}

/**
 * Extract tool calls from AI message
 * Similar to the Python extract_tool_calls function
 */
export function extractToolCalls(message: any): any[] {
  if (message && message.tool_calls) {
    return message.tool_calls;
  }
  return [];
}
