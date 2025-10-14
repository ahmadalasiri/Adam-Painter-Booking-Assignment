import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import morgan from 'morgan';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Set global prefix for all routes
  app.setGlobalPrefix('api/v1');

  // Security: Use Helmet to protect against common web vulnerabilities
  app.use(helmet());

  // HTTP request logging
  app.use(morgan('dev'));

  // Enable CORS - Allow all origins
  app.enableCors({
    origin: true, // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 3600,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);

  console.log(`🚀 Application running on: http://localhost:${port}/api/v1`);
}
bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
