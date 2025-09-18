import { RunnableConfig } from '@langchain/core/runnables';
import { KronosAgentState } from './state';

/**
 * Extract context values from state and config
 * Similar to the Python get_context_value function
 */
export function getContextValue(
  state: KronosAgentState,
  config: RunnableConfig,
  key: string
): string | undefined {
  // First check config metadata
  if (config?.configurable?.[key]) {
    return config.configurable[key];
  }
  
  // Then check state
  if (state[key as keyof KronosAgentState]) {
    return state[key as keyof KronosAgentState] as string;
  }
  
  return undefined;
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

/**
 * Generate a unique conversation ID
 */
export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format current date for prompts
 */
export function getCurrentDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
