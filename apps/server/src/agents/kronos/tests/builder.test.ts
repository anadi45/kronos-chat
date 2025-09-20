import { KronosAgentBuilder } from '../builder';

describe('KronosAgentBuilder', () => {
  let builder: KronosAgentBuilder;
  let mockCheckpointer: any;
  let mockOAuthIntegrationsService: any;
  let mockToolsExecutorService: any;
  let mockToolsProviderService: any;

  beforeEach(() => {
    // Mock environment variables
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.COMPOSIO_API_KEY = 'test-composio-key';
    
    // Mock checkpointer service
    mockCheckpointer = {
      isReady: jest.fn().mockReturnValue(true),
      getPostgresSaver: jest.fn().mockReturnValue({}),
    } as any;

    // Mock OAuth integrations service
    mockOAuthIntegrationsService = {
      // Add any methods that might be called
    } as any;

    // Mock tools executor service
    mockToolsExecutorService = {
      executeToolsAndReturnMessages: jest.fn(),
    } as any;

    // Mock tools provider service
    mockToolsProviderService = {
      getAvailableTools: jest.fn().mockResolvedValue([]),
    } as any;
    
    builder = new KronosAgentBuilder(
      'test-user-id',
      mockCheckpointer,
      mockOAuthIntegrationsService,
      mockToolsExecutorService,
      mockToolsProviderService
    );
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.GEMINI_API_KEY;
    delete process.env.COMPOSIO_API_KEY;
  });

  it('should initialize without errors', () => {
    expect(builder).toBeDefined();
  });

  it('should throw error when GEMINI_API_KEY is missing', () => {
    delete process.env.GEMINI_API_KEY;
    
    expect(() => {
      new KronosAgentBuilder(
        'test-user-id',
        mockCheckpointer,
        mockOAuthIntegrationsService,
        mockToolsExecutorService,
        mockToolsProviderService
      );
    }).toThrow('GEMINI_API_KEY environment variable is required');
  });

  it('should throw error when COMPOSIO_API_KEY is missing', () => {
    delete process.env.COMPOSIO_API_KEY;
    
    expect(() => {
      new KronosAgentBuilder(
        'test-user-id',
        mockCheckpointer,
        mockOAuthIntegrationsService,
        mockToolsExecutorService,
        mockToolsProviderService
      );
    }).toThrow('COMPOSIO_API_KEY environment variable is required');
  });

  it('should build a graph successfully', async () => {
    const graph = await builder.build();
    expect(graph).toBeDefined();
    expect(typeof graph.invoke).toBe('function');
  });

  it('should build a graph with checkpointer', async () => {
    const graph = await builder.build();
    expect(graph).toBeDefined();
    expect(typeof graph.invoke).toBe('function');
  });
});
