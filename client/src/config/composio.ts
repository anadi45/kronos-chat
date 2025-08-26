// Composio configuration
export const COMPOSIO_CONFIG = {
  // API key for Composio - get it from https://www.composio.dev/
  // This should be set in your environment variables for security
  API_KEY: import.meta.env.VITE_COMPOSIO_API_KEY || '',
  
  // Base URL for Composio API
  BASE_URL: 'https://backend.composio.dev/api',
  
  // Timeout for connection requests (in milliseconds)
  CONNECTION_TIMEOUT: 60000,
  
  // Supported providers
  PROVIDERS: {
    GITHUB: 'github',
    SLACK: 'slack',
    NOTION: 'notion',
    GMAIL: 'gmail',
    GOOGLE_CALENDAR: 'google_calendar',
    TWITTER: 'twitter',
    DISCORD: 'discord',
  } as const,
};

// Type for provider names
export type ProviderName = typeof COMPOSIO_CONFIG.PROVIDERS[keyof typeof COMPOSIO_CONFIG.PROVIDERS];