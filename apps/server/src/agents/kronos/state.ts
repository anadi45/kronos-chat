import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';

export interface KronosAgentState {
  messages: BaseMessage[];
  userId: string;
  result: string;
}

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
