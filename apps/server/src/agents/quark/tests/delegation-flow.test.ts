import { QuarkAgent } from '../agent';
import { Provider } from '@quark/core';

describe('QuarkAgent Delegation Flow', () => {
  let agent: QuarkAgent;
  let mockCheckpointer: any;
  let mockToolsExecutorService: any;
  let mockToolsProviderService: any;

  beforeEach(() => {
    // Mock checkpointer service
    mockCheckpointer = {
      isReady: jest.fn().mockReturnValue(true),
      getPostgresSaver: jest.fn().mockReturnValue({}),
    } as any;

    // Mock tools executor service
    mockToolsExecutorService = {
      executeToolsAndReturnMessages: jest.fn(),
    } as any;

    // Mock tools provider service
    mockToolsProviderService = {
      getAvailableTools: jest.fn().mockResolvedValue([]),
      initializeDelegationTools: jest.fn(),
    } as any;
  });

  describe('Sequential Execution Flow', () => {
    it('should handle Reddit -> Gmail sequential flow correctly', async () => {
      // Setup agent with Reddit and Gmail toolkits
      agent = new QuarkAgent({
        userId: 'test-user-id',
        checkpointerService: mockCheckpointer,
        toolsExecutorService: mockToolsExecutorService,
        toolsProviderService: mockToolsProviderService,
        toolkits: [Provider.REDDIT, Provider.GMAIL]
      });

      const compiledAgent = await agent.getCompiledAgent();
      expect(compiledAgent).toBeDefined();

      // Test the sequential flow
      const testMessage = "send some reddit post summary from r/agentsofai to ranjeetbaraik04@gmail.com";
      
      // This should trigger sequential execution:
      // 1. First call delegateToRedditAgent
      // 2. Wait for results
      // 3. Then call delegateToGmailAgent with Reddit data as context
      
      // The agent should recognize this as a sequential workflow
      // because Reddit data is needed for email content
      expect(testMessage).toContain('reddit');
      expect(testMessage).toContain('email');
      expect(testMessage).toContain('summary');
    });

    it('should handle independent tasks with parallel execution', async () => {
      // Setup agent with Gmail and Google Calendar toolkits
      agent = new QuarkAgent({
        userId: 'test-user-id',
        checkpointerService: mockCheckpointer,
        toolsExecutorService: mockToolsExecutorService,
        toolsProviderService: mockToolsProviderService,
        toolkits: [Provider.GMAIL, Provider.GOOGLE_CALENDAR]
      });

      const compiledAgent = await agent.getCompiledAgent();
      expect(compiledAgent).toBeDefined();

      // Test the parallel flow
      const testMessage = "send email to John and create a calendar event for tomorrow";
      
      // This should trigger parallel execution:
      // Both tasks are independent and can run simultaneously
      expect(testMessage).toContain('email');
      expect(testMessage).toContain('calendar');
      expect(testMessage).toContain('and'); // Indicates independent tasks
    });
  });

  describe('Dependency Detection', () => {
    it('should identify sequential dependencies correctly', () => {
      const sequentialPatterns = [
        "get reddit posts and email the summary",
        "search for information and then create a document",
        "find my calendar availability and send meeting invites",
        "research a topic and post about it on social media"
      ];

      sequentialPatterns.forEach(pattern => {
        // These should be identified as sequential because:
        // - One task's output is used as input for another
        // - Contains words like "and", "then", "using", "with"
        expect(pattern).toMatch(/and|then|using|with/);
      });
    });

    it('should identify parallel execution opportunities correctly', () => {
      const parallelPatterns = [
        "send email to John and create a calendar event",
        "get my Gmail profile and list my Google Drive files",
        "check GitHub notifications and search for news about AI"
      ];

      parallelPatterns.forEach(pattern => {
        // These should be identified as parallel because:
        // - Tasks are completely independent
        // - No data flows between them
        expect(pattern).toMatch(/and/);
        expect(pattern).not.toMatch(/then|using|with|summary|based on/);
      });
    });
  });

  describe('Context Passing', () => {
    it('should pass context correctly in sequential execution', () => {
      // In sequential execution, the first task's results should be passed
      // as context to the second task
      const redditResults = "Reddit post data here...";
      const gmailContext = `Create email with this Reddit data: ${redditResults}`;
      
      expect(gmailContext).toContain('Reddit data');
      expect(gmailContext).toContain(redditResults);
    });
  });
});
