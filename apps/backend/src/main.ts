import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerConfig } from './config/swagger.config';
import { AllExceptionsFilter, HttpExceptionFilter } from './filters/http-exception.filter';

let app: any;

async function bootstrap() {
  if (!app) {
    console.log('🚀 Initializing NestJS app for Vercel...');

    app = await NestFactory.create(AppModule, {
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
      new AllExceptionsFilter(),
      new HttpExceptionFilter(),
    );

    // CORS 설정
    app.enableCors({
      origin: [
        'http://localhost:3000',
        'https://task-flow-frontend.vercel.app',
        'https://taskflow-frontend.vercel.app',
        /\.vercel\.app$/,
        /^https:\/\/.*\.vercel\.app$/,
        process.env.FRONTEND_URL
      ].filter(Boolean),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Origin',
        'X-Requested-With',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Credentials'
      ],
      optionsSuccessStatus: 200
    });

    // 보안 헤더 설정
    app.use((req: any, res: any, next: any) => {
      res.header('X-Content-Type-Options', 'nosniff');
      res.header('X-Frame-Options', 'DENY');
      res.header('X-XSS-Protection', '1; mode=block');
      next();
    });

    // Swagger 설정 (개발 환경에서만)
    if (process.env.NODE_ENV !== 'production') {
      SwaggerConfig.setup(app);
      console.log('📚 Swagger documentation enabled');
    }

    // 글로벌 프리픽스 설정
    app.setGlobalPrefix('api', {
      exclude: ['/health', '/'],
    });

    await app.init();
    console.log('✅ NestJS app initialized successfully');
  }

  return app;
}

// Vercel Serverless 함수로 내보내기
export default async (req: any, res: any) => {
  try {
    const server = await bootstrap();
    const httpAdapter = server.getHttpAdapter();
    const instance = httpAdapter.getInstance();

    return instance(req, res);
  } catch (error) {
    console.error('❌ Error in serverless function:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
    });
  }
};

// 로컬 개발용
if (process.env.NODE_ENV !== 'production') {
  bootstrap().then((app) => {
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      console.log(`🚀 TaskFlow Backend API is running on: http://localhost:${port}`);
      console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
    });
  }).catch(error => {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  });
}
