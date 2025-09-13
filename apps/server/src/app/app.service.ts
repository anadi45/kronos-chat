import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getAppInfo() {
    return {
      name: 'Kronos Chat API',
      version: '1.0.0',
      description:
        'A NestJS backend for the Kronos chat application',
      environment: process.env.NODE_ENV || 'development',
      docsUrl: process.env.NODE_ENV !== 'production' ? '/api/docs' : null,
    };
  }

  getHealthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'healthy', // TODO: Add actual database health check
        configured: true,
      },
    };
  }
}
