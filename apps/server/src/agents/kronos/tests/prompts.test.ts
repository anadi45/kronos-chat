import { generateSystemPrompt } from '../prompts';
import { Provider } from '@kronos/core';

describe('Dynamic System Prompt Generation', () => {
  it('should generate system prompt with only Gmail integration', () => {
    const toolkits = [Provider.GMAIL];
    const prompt = generateSystemPrompt(toolkits);
    
    expect(prompt).toContain('Gmail');
    expect(prompt).toContain('GmailSubagent');
    expect(prompt).toContain('Email management');
    expect(prompt).not.toContain('GitHub');
    expect(prompt).not.toContain('Slack');
  });

  it('should generate system prompt with multiple integrations', () => {
    const toolkits = [Provider.GMAIL, Provider.GITHUB, Provider.SLACK];
    const prompt = generateSystemPrompt(toolkits);
    
    expect(prompt).toContain('Gmail');
    expect(prompt).toContain('GitHub');
    expect(prompt).toContain('Slack');
    expect(prompt).not.toContain('Instagram');
    expect(prompt).not.toContain('LinkedIn');
  });

  it('should generate system prompt with all integrations', () => {
    const toolkits = Object.values(Provider);
    const prompt = generateSystemPrompt(toolkits);
    
    expect(prompt).toContain('Gmail');
    expect(prompt).toContain('GitHub');
    expect(prompt).toContain('Slack');
    expect(prompt).toContain('Instagram');
    expect(prompt).toContain('LinkedIn');
  });

  it('should handle empty toolkits array', () => {
    const toolkits: Provider[] = [];
    const prompt = generateSystemPrompt(toolkits);
    
    expect(prompt).toContain('<available_integrations>');
    expect(prompt).toContain('</available_integrations>');
    expect(prompt).not.toContain('<integration>');
  });

  it('should include today\'s date in the prompt', () => {
    const toolkits = [Provider.GMAIL];
    const prompt = generateSystemPrompt(toolkits);
    
    expect(prompt).toContain('Today\'s date:');
  });
});
