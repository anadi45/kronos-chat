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
 * Tavily Search Answer Tool
 * Get direct answers to specific questions with source citations
 */
export const tavilySearchAnswerTool = {
  name: 'TAVILY_SEARCH_ANSWER',
  description: 'Get direct answers to specific questions with source citations using Tavily API',
  parameters: z.object({
    question: z.string().describe('The specific question to get an answer for'),
    max_results: z.number().optional().default(3).describe('Maximum number of sources to use for answer'),
  }),
  execute: async (params: { question: string; max_results?: number }) => {
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
          query: params.question,
          max_results: params.max_results || 3,
          include_answer: true,
          search_depth: 'advanced',
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
          sources: data.results?.map((r: TavilySearchResult) => ({
            title: r.title,
            url: r.url,
            content: r.content,
            score: r.score,
          })) || [],
          query: params.question,
          follow_up_questions: data.follow_up_questions,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get search answer: ${error.message}`);
    }
  },
};

/**
 * Tavily Get Content Tool
 * Extract detailed content from specific URLs
 */
export const tavilyGetContentTool = {
  name: 'TAVILY_GET_CONTENT',
  description: 'Extract detailed content from specific URLs using Tavily API',
  parameters: z.object({
    urls: z.array(z.string().url()).describe('Array of URLs to extract content from'),
  }),
  execute: async (params: { urls: string[] }) => {
    const apiKey = process.env.TAVILY_API_KEY;
    
    if (!apiKey) {
      throw new Error('Tavily API key not configured. Please set TAVILY_API_KEY environment variable.');
    }

    try {
      // For each URL, perform a search to get content
      const results = await Promise.all(
        params.urls.map(async (url) => {
          try {
            const response = await fetch('https://api.tavily.com/search', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                api_key: apiKey,
                query: `site:${url}`,
                max_results: 1,
                include_answer: true,
                search_depth: 'advanced',
              }),
            });

            if (!response.ok) {
              throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as TavilyApiResponse;
            
            return {
              url,
              content: data.results?.[0]?.content || 'Content not found',
              title: data.results?.[0]?.title || 'No title',
              success: true,
            };
          } catch (error) {
            return {
              url,
              content: null,
              title: null,
              success: false,
              error: error.message,
            };
          }
        })
      );

      return {
        success: true,
        data: {
          extracted_content: results,
          total_urls: params.urls.length,
          successful_extractions: results.filter(r => r.success).length,
        },
      };
    } catch (error) {
      throw new Error(`Failed to extract content: ${error.message}`);
    }
  },
};

/**
 * Export all Tavily tools
 */
export const tavilyTools = [
  tavilySearchTool,
  tavilySearchAnswerTool,
  tavilyGetContentTool,
];
