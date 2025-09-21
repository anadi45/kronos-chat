import { KronosAgent } from '../agent';

describe('KronosAgent', () => {
  let agent: KronosAgent;
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
    } as any;
    
    agent = new KronosAgent(
      'test-user-id',
      mockCheckpointer,
      mockToolsExecutorService,
      mockToolsProviderService
    );
  });

  it('should be defined', () => {
    expect(agent).toBeDefined();
  });

  it('should create a compiled agent', () => {
    const compiledAgent = agent.getCompiledAgent();
    expect(compiledAgent).toBeDefined();
  });

  // Note: Integration tests with actual Gemini API would require API key
  // and should be run separately or in a test environment
});
