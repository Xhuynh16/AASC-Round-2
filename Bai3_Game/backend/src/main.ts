import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(new ValidationPipe());

  // Get config service
  const configService = app.get(ConfigService);

  // Configure CORS
  app.enableCors({
    origin: 'http://localhost:4200', // Angular frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  });

  // Get port from config or use default
  const port = configService.get('PORT') || 3000;

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
