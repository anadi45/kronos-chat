import { 
  getToolsForToolkit, 
  getToolsForToolkits, 
  isToolSupportedByToolkit,
  getToolkitInfo,
  getAllToolkits,
  TOOLKIT_TOOLS_MAPPING
} from './toolkit-mappings';
import { Provider } from '@kronos/core';

describe('Toolkit Mappings', () => {
  describe('getToolsForToolkit', () => {
    it('should return tools for Gmail toolkit', () => {
      const tools = getToolsForToolkit(Provider.GMAIL);
      expect(tools).toContain('gmail_send_email');
      expect(tools).toContain('gmail_read_emails');
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should return tools for GitHub toolkit', () => {
      const tools = getToolsForToolkit(Provider.GITHUB);
      expect(tools).toContain('github_create_repository');
      expect(tools).toContain('github_create_issue');
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should return empty array for unknown toolkit', () => {
      const tools = getToolsForToolkit('UNKNOWN_TOOLKIT');
      expect(tools).toEqual([]);
    });
  });

  describe('getToolsForToolkits', () => {
    it('should return combined tools for multiple toolkits', () => {
      const tools = getToolsForToolkits([Provider.GMAIL, Provider.GITHUB]);
      expect(tools).toContain('gmail_send_email');
      expect(tools).toContain('github_create_repository');
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should remove duplicates', () => {
      const tools = getToolsForToolkits([Provider.GMAIL, Provider.GMAIL]);
      const uniqueTools = [...new Set(tools)];
      expect(tools.length).toBe(uniqueTools.length);
    });
  });

  describe('isToolSupportedByToolkit', () => {
    it('should return true for supported tool', () => {
      const isSupported = isToolSupportedByToolkit(Provider.GMAIL, 'gmail_send_email');
      expect(isSupported).toBe(true);
    });

    it('should return false for unsupported tool', () => {
      const isSupported = isToolSupportedByToolkit(Provider.GMAIL, 'github_create_repository');
      expect(isSupported).toBe(false);
    });
  });

  describe('getToolkitInfo', () => {
    it('should return toolkit information', () => {
      const info = getToolkitInfo(Provider.GMAIL);
      expect(info.toolkit).toBe(Provider.GMAIL);
      expect(info.toolCount).toBeGreaterThan(0);
      expect(info.tools).toContain('gmail_send_email');
    });
  });

  describe('getAllToolkits', () => {
    it('should return all available toolkits', () => {
      const toolkits = getAllToolkits();
      expect(toolkits).toContain(Provider.GMAIL);
      expect(toolkits).toContain(Provider.GITHUB);
      expect(toolkits.length).toBeGreaterThan(0);
    });
  });

  describe('TOOLKIT_TOOLS_MAPPING', () => {
    it('should have mappings for all providers', () => {
      expect(TOOLKIT_TOOLS_MAPPING[Provider.GMAIL]).toBeDefined();
      expect(TOOLKIT_TOOLS_MAPPING[Provider.GITHUB]).toBeDefined();
      expect(TOOLKIT_TOOLS_MAPPING[Provider.NOTION]).toBeDefined();
      expect(TOOLKIT_TOOLS_MAPPING[Provider.SLACK]).toBeDefined();
      expect(TOOLKIT_TOOLS_MAPPING[Provider.TWITTER]).toBeDefined();
      expect(TOOLKIT_TOOLS_MAPPING[Provider.LINKEDIN]).toBeDefined();
      expect(TOOLKIT_TOOLS_MAPPING[Provider.REDDIT]).toBeDefined();
      expect(TOOLKIT_TOOLS_MAPPING[Provider.GOOGLE_DRIVE]).toBeDefined();
      expect(TOOLKIT_TOOLS_MAPPING[Provider.GOOGLE_CALENDAR]).toBeDefined();
      expect(TOOLKIT_TOOLS_MAPPING[Provider.INSTAGRAM]).toBeDefined();
    });

    it('should have non-empty tool arrays for each provider', () => {
      Object.values(TOOLKIT_TOOLS_MAPPING).forEach(tools => {
        expect(tools.length).toBeGreaterThan(0);
      });
    });
  });
});
