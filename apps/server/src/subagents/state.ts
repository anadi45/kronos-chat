import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';

export interface SubagentState {
  messages: BaseMessage[];
  result?: string;
}

export const SubagentStateSchema = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  result: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
});
