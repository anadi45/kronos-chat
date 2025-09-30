import { QuarkAgentBuilder, QuarkAgentConfig } from "./builder";
import { CheckpointerService } from "../../checkpointer";
import { ToolsExecutorService } from "../../tools/tools-executor.service";
import { ToolsProviderService } from "../../tools/tools-provider.service";
import { StateGraph } from "@langchain/langgraph";
import { Provider } from "@quark/core";

export class QuarkAgent {
  private userId: string;
  private checkpointerService: CheckpointerService;
  private toolsExecutorService: ToolsExecutorService;
  private toolsProviderService: ToolsProviderService;
  private toolkits: Provider[];

  constructor(config: QuarkAgentConfig) {
    this.userId = config.userId;
    this.checkpointerService = config.checkpointerService;
    this.toolsExecutorService = config.toolsExecutorService;
    this.toolsProviderService = config.toolsProviderService;
    this.toolkits = config.toolkits;
  }

  async getCompiledAgent(): Promise<ReturnType<StateGraph<any>["compile"]>> {
    const compiledAgent = await new QuarkAgentBuilder({
      userId: this.userId,
      checkpointerService: this.checkpointerService,
      toolsExecutorService: this.toolsExecutorService,
      toolsProviderService: this.toolsProviderService,
      toolkits: this.toolkits,
    }).build();

    return compiledAgent;
  }
}
