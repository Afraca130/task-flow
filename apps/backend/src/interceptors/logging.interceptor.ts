import { TimeUtil } from '@/common/utils/time.util';
import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        name: string;
    };
}

/**
 * API 호출 로깅 인터셉터
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    constructor() { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const response = context.switchToHttp().getResponse<Response>();
        const method = request.method;
        const url = request.url;
        const ip = request.ip || request.connection.remoteAddress;
        const userId = request.user?.id;

        const startTime = TimeUtil.now().getTime();

        return next
            .handle()
            .pipe(
                tap({
                    next: (data) => {
                        const endTime = TimeUtil.now().getTime();
                        const responseTime = endTime - startTime;
                        const statusCode = response.statusCode;

                        // Basic HTTP logging
                        this.logger.log(
                            `${method} ${url} ${statusCode} ${responseTime}ms - ${ip}${userId ? ` - User: ${userId}` : ''}`
                        );

                        // Log additional details for non-GET requests
                        if (method !== 'GET' && userId) {
                            this.logger.debug(`Request details for ${method} ${url}:`, {
                                userId,
                                ip,
                                responseTime,
                                statusCode
                            });
                        }
                    },
                    error: (error) => {
                        const endTime = Date.now();
                        const responseTime = endTime - startTime;
                        const statusCode = error.status || 500;

                        this.logger.error(
                            `${method} ${url} ${statusCode} ${responseTime}ms - ${ip}${userId ? ` - User: ${userId}` : ''} - Error: ${error.message}`
                        );
                    }
                })
            );
    }
}
