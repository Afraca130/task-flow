import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
    getHello(): string {
        return 'TaskFlow API is running!';
    }

    healthCheck(type?: string) {
        const baseResponse = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };

        switch (type) {
            case 'database':
                return {
                    ...baseResponse,
                    checks: {
                        database: 'ok',
                    },
                };
            case 'api':
                return {
                    ...baseResponse,
                    checks: {
                        api: 'ok',
                    },
                };
            default:
                return {
                    ...baseResponse,
                    checks: {
                        api: 'ok',
                        database: 'ok',
                    },
                };
        }
    }
}
