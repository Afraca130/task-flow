import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { SwaggerConfig } from '../src/config/swagger.config';

let app: any;

async function createNestApp() {
    if (!app) {
        app = await NestFactory.create(AppModule);

        app.enableCors({
            origin: true,
            credentials: true,
        });

        app.useGlobalPipes(new ValidationPipe());

        // Swagger 설정
        const config = new DocumentBuilder()
            .setTitle('TaskFlow API')
            .setDescription('TaskFlow API Documentation')
            .setVersion('1.0')
            .addBearerAuth()
            .build();

        SwaggerConfig.setup(app);

        // 글로벌 프리픽스 설정
        app.setGlobalPrefix('api', {
            exclude: ['/health', '/'],
        });

        await app.init();
    }
    return app;
}

export default async function handler(req: any, res: any) {
    const app = await createNestApp();
    const server = app.getHttpAdapter().getInstance();
    return server(req, res);
}
