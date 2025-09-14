import { KronosAgent } from '../agent';

describe('KronosAgent', () => {
  let agent: KronosAgent;

  beforeEach(() => {
    agent = new KronosAgent();
  });

  it('should be defined', () => {
    expect(agent).toBeDefined();
  });

  it('should generate a conversation ID', () => {
    const id1 = agent.generateConversationId();
    const id2 = agent.generateConversationId();
    
    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^conv_\d+_[a-z0-9]+$/);
  });

  // Note: Integration tests with actual Gemini API would require API key
  // and should be run separately or in a test environment
});
