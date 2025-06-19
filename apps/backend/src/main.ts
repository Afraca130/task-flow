import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerConfig } from './config/swagger.config';
import { HttpExceptionFilter } from './filters/http-exception.filter';

async function bootstrap() {
  console.log('Starting TaskFlow Backend API...');

  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn']
      : ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // 전역 파이프 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 전역 필터 설정
  app.useGlobalFilters(
    new HttpExceptionFilter(),
  );

  // CORS configuration - Allow all origins
  app.enableCors({
    origin: true, // Allow all origins
    credentials: true,
  });

  // Swagger 설정 (개발 환경에서만)
  if (process.env.NODE_ENV !== 'production') {
    SwaggerConfig.setup(app);
  }

  // 글로벌 프리픽스 설정
  app.setGlobalPrefix('api', {
    exclude: ['/health', '/'],
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`TaskFlow Backend API is running on: http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
  }
}

bootstrap().catch(error => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
