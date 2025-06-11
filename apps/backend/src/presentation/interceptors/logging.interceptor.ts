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
import { UserLogService } from '../../application/services/user-log.service';
import { LoggingConfigService } from '../../infrastructure/config/logging.config';

/**
 * API 호출 로깅 인터셉터
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    constructor(
        private readonly userLogService: UserLogService,
        private readonly loggingConfig: LoggingConfigService,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        if (!this.loggingConfig.isAPILoggingEnabled()) {
            return next.handle();
        }

        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();
        const startTime = Date.now();

        // 사용자 ID 추출 (JWT에서)
        const userId = this.extractUserId(request);

        return next.handle().pipe(
            tap({
                next: (responseData) => {
                    const responseTime = Date.now() - startTime;
                    const statusCode = response.statusCode;

                    // 비동기로 로그 기록 (성능 영향 최소화)
                    setImmediate(() => {
                        this.userLogService.logApiCall(
                            request,
                            responseTime,
                            statusCode,
                            userId,
                        ).catch(error => {
                            this.logger.error('Failed to log API call in interceptor', error);
                        });
                    });
                },
                error: (error) => {
                    const responseTime = Date.now() - startTime;
                    const statusCode = error.status || response.statusCode || 500;

                    // 에러 로깅
                    setImmediate(() => {
                        this.userLogService.logApiCall(
                            request,
                            responseTime,
                            statusCode,
                            userId,
                            error,
                        ).catch(logError => {
                            this.logger.error('Failed to log API error in interceptor', logError);
                        });
                    });
                },
            }),
        );
    }

    private extractUserId(request: Request): string | undefined {
        // JWT 토큰에서 사용자 ID 추출
        const user = (request as any).user;
        return user?.id || user?.userId || user?.sub;
    }
}
