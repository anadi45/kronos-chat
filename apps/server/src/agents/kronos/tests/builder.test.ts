import { KronosAgentBuilder } from '../builder';

describe('KronosAgentBuilder', () => {
  let builder: KronosAgentBuilder;

  beforeEach(() => {
    // Mock environment variables
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.COMPOSIO_API_KEY = 'test-composio-key';
    
    builder = new KronosAgentBuilder();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.GEMINI_API_KEY;
    delete process.env.COMPOSIO_API_KEY;
  });

  it('should initialize without errors', () => {
    expect(builder).toBeDefined();
    expect(builder.generateConversationId()).toMatch(/^conv_\d+_[a-z0-9]+$/);
  });

  it('should throw error when GEMINI_API_KEY is missing', () => {
    delete process.env.GEMINI_API_KEY;
    
    expect(() => {
      new KronosAgentBuilder();
    }).toThrow('GEMINI_API_KEY environment variable is required');
  });

  it('should throw error when COMPOSIO_API_KEY is missing', () => {
    delete process.env.COMPOSIO_API_KEY;
    
    expect(() => {
      new KronosAgentBuilder();
    }).toThrow('COMPOSIO_API_KEY environment variable is required');
  });

  it('should build a graph successfully', async () => {
    const graph = await builder.build();
    expect(graph).toBeDefined();
    expect(typeof graph.compile).toBe('function');
  });

  it('should generate unique conversation IDs', () => {
    const id1 = builder.generateConversationId();
    const id2 = builder.generateConversationId();
    
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^conv_\d+_[a-z0-9]+$/);
    expect(id2).toMatch(/^conv_\d+_[a-z0-9]+$/);
  });
});
