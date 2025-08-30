/**
 * Kronos Chat API Server
 * NestJS backend for the Kronos chat application with Composio integration
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix for all routes
  const globalPrefix = process.env.API_PREFIX?.replace('/', '') || 'api/v1';
  app.setGlobalPrefix(globalPrefix);

  // Enable CORS
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://your-frontend-domain.com'] // Replace with your frontend domain
        : [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:4200',
          ],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);

  Logger.log(
    `🚀 Kronos Chat API is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `📚 API Documentation: http://localhost:${port}/${globalPrefix}/docs`
  );
}

bootstrap();
