export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  success: boolean;
  error?: string;
}

export interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  database: {
    status: string;
    configured: boolean;
    error?: string;
  };
}

export interface AppInfo {
  name: string;
  version: string;
  description: string;
  environment: string;
  docsUrl?: string;
}
