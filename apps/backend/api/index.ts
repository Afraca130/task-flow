import { HttpExceptionFilter } from '@/filters/http-exception.filter';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express from 'express';
import { AppModule } from '../src/app.module';

const server = express();

let app: any;

async function createNestServer(expressInstance: express.Express) {
    const adapter = new ExpressAdapter(expressInstance);

    app = await NestFactory.create(AppModule, adapter);

    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));

    // Global exception filter
    app.useGlobalFilters(new HttpExceptionFilter());

    // API versioning
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

    // CORS configuration
    app.enableCors({
        origin: [
            'http://localhost:3000',
            'https://taskflow-frontend.vercel.app',
            /\.vercel\.app$/,
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Global prefix
    app.setGlobalPrefix('api');

    // Swagger configuration for production
    if (process.env.NODE_ENV !== 'production') {
        const swaggerConfig = new DocumentBuilder()
            .setTitle('TaskFlow API')
            .setDescription('Clean Architecture NestJS API with comprehensive documentation')
            .setVersion('1.0.0')
            .addBearerAuth(
                {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    name: 'JWT',
                    description: 'Enter JWT token',
                    in: 'header',
                },
                'JWT-auth'
            )
            .build();

        const document = SwaggerModule.createDocument(app, swaggerConfig);
        SwaggerModule.setup('api/docs', app, document);
    }

    await app.init();
    return app;
}

export default async (req: any, res: any) => {
    if (!app) {
        await createNestServer(server);
    }

    return server(req, res);
};
