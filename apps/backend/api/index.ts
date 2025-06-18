import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/filters/http-exception.filter';

const server = express();
let isAppInitialized = false;

async function createNestServer() {
    if (isAppInitialized) {
        return server;
    }

    try {
        const adapter = new ExpressAdapter(server);
        const app = await NestFactory.create(AppModule, adapter);

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

        // CORS configuration - Allow all origins for Vercel
        app.enableCors({
            origin: true, // Allow all origins
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
        });

        // Global prefix
        app.setGlobalPrefix('api');

        // Initialize the app
        await app.init();
        isAppInitialized = true;

        console.log('NestJS app initialized successfully for Vercel');
        return server;
    } catch (error) {
        console.error('Error initializing NestJS app:', error);
        throw error;
    }
}

export default async (req: any, res: any) => {
    try {
        console.log(`${req.method} ${req.url}`);
        const app = await createNestServer();
        return app(req, res);
    } catch (error) {
        console.error('Error in Vercel handler:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
};
