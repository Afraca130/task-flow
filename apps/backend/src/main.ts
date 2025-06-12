import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter, HttpExceptionFilter } from './presentation/filters/http-exception.filter';
import { SwaggerConfig } from './shared/config/swagger.config';

/**
 * 애플리케이션 부트스트랩 함수
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
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
      new AllExceptionsFilter(),
      new HttpExceptionFilter(),
    );

    // CORS 설정
    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    // 보안 헤더 설정
    app.use((req, res, next) => {
      res.header('X-Content-Type-Options', 'nosniff');
      res.header('X-Frame-Options', 'DENY');
      res.header('X-XSS-Protection', '1; mode=block');
      next();
    });

    // Swagger 문서화 설정
    if (process.env.NODE_ENV !== 'production') {
      SwaggerConfig.setup(app);
      logger.log('📚 Swagger documentation is enabled');
    }

    // 글로벌 프리픽스 설정
    app.setGlobalPrefix('api', {
      exclude: ['/health', '/'],
    });


    const port = process.env.PORT || 3001;
    await app.listen(port);

    logger.log(`🚀 TaskFlow Backend API is running on: http://localhost:${port}`);
    logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

    if (process.env.NODE_ENV !== 'production') {
      logger.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
    }

  } catch (error) {
    logger.error('❌ Failed to start application', error);
    process.exit(1);
  }
}

bootstrap();
