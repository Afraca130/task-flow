// import { AppModule } from '@/app.module';
// import { ValidationPipe } from '@nestjs/common';
// import { NestFactory } from '@nestjs/core';
// import { ExpressAdapter } from '@nestjs/platform-express';
// import express from 'express';

// let cachedApp: any;

// async function createApp() {
//     if (cachedApp) {
//         return cachedApp;
//     }

//     const expressApp = express();

//     const app = await NestFactory.create(
//         AppModule,
//         new ExpressAdapter(expressApp),
//         {
//             logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['log', 'error', 'warn', 'debug', 'verbose']
//         }
//     );

//     // Global validation pipe
//     app.useGlobalPipes(new ValidationPipe({
//         whitelist: true,
//         forbidNonWhitelisted: true,
//         transform: true,
//         disableErrorMessages: process.env.NODE_ENV === 'production',
//     }));

//     // CORS 설정
//     app.enableCors({
//         origin: [
//             'http://localhost:3000',
//             'https://your-frontend-domain.vercel.app',
//             process.env.FRONTEND_URL,
//         ].filter(Boolean),
//         credentials: true,
//         methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//         allowedHeaders: ['Content-Type', 'Authorization'],
//     });

//     // Global prefix
//     app.setGlobalPrefix('api');

//     await app.init();
//     cachedApp = app;

//     return app;
// }

// export default async (req: any, res: any) => {
//     try {
//         const app = await createApp();
//         const expressApp = app.getHttpAdapter().getInstance();
//         return expressApp(req, res);
//     } catch (error) {
//         console.error('Error in Vercel handler:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// };
