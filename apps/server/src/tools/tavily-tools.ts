import { z } from 'zod';

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

interface TavilyApiResponse {
  answer?: string;
  results: TavilySearchResult[];
  query: string;
  follow_up_questions?: string[];
}

/**
 * Tavily Web Search Tool
 * Performs comprehensive web searches using Tavily API directly
 */
export const tavilySearchTool = {
  name: 'TAVILY_SEARCH',
  description: 'Perform comprehensive web searches with real-time results using Tavily API',
  parameters: z.object({
    query: z.string().describe('The search query to execute'),
    max_results: z.number().optional().default(5).describe('Maximum number of results to return (1-20)'),
    include_answer: z.boolean().optional().default(true).describe('Whether to include a direct answer'),
    search_depth: z.enum(['basic', 'advanced']).optional().default('basic').describe('Search depth level'),
    include_domains: z.array(z.string()).optional().describe('Specific domains to include in search'),
    exclude_domains: z.array(z.string()).optional().describe('Domains to exclude from search'),
  }),
  execute: async (params: {
    query: string;
    max_results?: number;
    include_answer?: boolean;
    search_depth?: 'basic' | 'advanced';
    include_domains?: string[];
    exclude_domains?: string[];
  }) => {
    const apiKey = process.env.TAVILY_API_KEY;
    
    if (!apiKey) {
      throw new Error('Tavily API key not configured. Please set TAVILY_API_KEY environment variable.');
    }

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: params.query,
          max_results: params.max_results || 5,
          include_answer: params.include_answer || true,
          include_domains: params.include_domains,
          exclude_domains: params.exclude_domains,
          search_depth: params.search_depth || 'basic',
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as TavilyApiResponse;
      
      return {
        success: true,
        data: {
          answer: data.answer,
          results: data.results || [],
          query: params.query,
          follow_up_questions: data.follow_up_questions,
          total_results: data.results?.length || 0,
        },
      };
    } catch (error) {
      throw new Error(`Failed to perform web search: ${error.message}`);
    }
  },
};


/**
 * Export all Tavily tools
 */
export const tavilyTools = [
  tavilySearchTool,
];
