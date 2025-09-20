import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';

export interface KronosAgentState {
  // Core conversation state
  messages: BaseMessage[];

  // User context
  userId: string;

  result: string;
}

// Define the state schema for LangGraph using Annotation
export const KronosAgentStateSchema = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  result: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  userId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
});
