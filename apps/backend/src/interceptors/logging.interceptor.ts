import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ActivityLogService } from '../activity-logs/activity-log.service';

/**
 * API 호출 로깅 인터셉터
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    constructor(
        private readonly activityLogService: ActivityLogService,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const now = Date.now();
        const request = context.switchToHttp().getRequest();
        const { method, url, user } = request;

        return next.handle().pipe(
            tap(async () => {
                const responseTime = Date.now() - now;
                this.logger.log(`${method} ${url} - ${responseTime}ms`);

                // Log API activity if user is authenticated
                if (user?.id && this.shouldLogActivity(url, method)) {
                    try {
                        await this.activityLogService.create({
                            userId: user.id,
                            action: this.mapMethodToAction(method),
                            description: `API call: ${method} ${url}`,
                            resourceType: 'api',
                            resourceId: url,
                            metadata: {
                                method,
                                url,
                                responseTime,
                                timestamp: new Date().toISOString(),
                            },
                        });
                    } catch (error) {
                        this.logger.error('Failed to log API activity', error);
                    }
                }
            }),
        );
    }

    private shouldLogActivity(url: string, method: string): boolean {
        // Skip logging for health checks, metrics, and GET requests to avoid spam
        const skipPaths = ['/health', '/metrics', '/api/docs'];
        const skipMethods = ['GET'];

        return !skipPaths.some(path => url.includes(path)) && !skipMethods.includes(method);
    }

    private mapMethodToAction(method: string): string {
        switch (method) {
            case 'POST': return 'CREATE';
            case 'PUT':
            case 'PATCH': return 'UPDATE';
            case 'DELETE': return 'DELETE';
            default: return 'ACCESS';
        }
    }
}
