import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { LogLevel, UserActionType, UserLog } from './entities/user-log.entity';
import { CreateUserLogRequest } from './interfaces/user-log.interface';
import { UserLogRepository } from './user-log.repository';
;


export interface LogUserActivityRequest {
    userId?: string;
    sessionId?: string;
    actionType: UserActionType;
    description: string;
    resourceId?: string;
    resourceType?: string;
    details?: Record<string, any>;
    level?: LogLevel;
    request?: Request;
    responseTime?: number;
    statusCode?: number;
    errorMessage?: string;
    errorStack?: string;
}

export interface LogUserActivityDto {
    userId: string;
    actionType: UserActionType;
    description: string;
    resourceId?: string;
    resourceType?: string;
    details?: Record<string, any>;
}

/**
 * 사용자 로깅 서비스
 */
@Injectable()
export class UserLogService {
    private readonly logger = new Logger(UserLogService.name);

    constructor(
        @InjectRepository(UserLogRepository)
        private readonly userLogRepository: UserLogRepository,
        @InjectRepository(UserLog)
        private readonly userLogTypeormRepository: Repository<UserLog>,
    ) { }

    /**
     * 사용자 활동 로그 기록
     */
    async logUserActivity(request: LogUserActivityRequest): Promise<void> {
        // UserLog 기능을 완전히 비활성화하여 메타데이터 오류 방지
        return;

        /*
        try {
            // 로깅이 비활성화된 경우 건너뛰기
            // if (!this.loggingConfig.isUserActivityLoggingEnabled()) {
            //     return;
            // }

            const logData: CreateUserLogRequest = {
                userId: request.userId,
                sessionId: request.sessionId,
                actionType: request.actionType,
                level: request.level || LogLevel.INFO,
                description: request.description,
                details: request.details,
                resourceId: request.resourceId,
                resourceType: request.resourceType,
                ipAddress: this.extractIpAddress(request.request),
                userAgent: request.request?.get('User-Agent'),
                method: request.request?.method,
                url: request.request?.originalUrl || request.request?.url,
                statusCode: request.statusCode,
                responseTime: request.responseTime,
                errorMessage: request.errorMessage,
                errorStack: request.errorStack,
            };

            await this.userLogRepository.create(logData);

            // 콘솔에도 로그 출력 (개발 환경)
            this.logToConsole(logData);
        } catch (error) {
            this.logger.error('Failed to log user activity', error);
            // 로깅 실패가 주요 기능을 방해하지 않도록 에러를 다시 던지지 않음
        }
        */
    }

    /**
     * API 호출 로그 기록
     */
    async logApiCall(
        request: Request,
        responseTime: number,
        statusCode: number,
        userId?: string,
        error?: Error,
    ): Promise<void> {
        try {
            // API 로깅이 비활성화된 경우 건너뛰기 (현재는 항상 활성화)
            // if (!this.loggingConfig.isAPILoggingEnabled()) {
            //     return;
            // }

            const level = this.determineLogLevel(statusCode, error);
            const actionType = UserActionType.API_ACCESS;

            await this.logUserActivity({
                userId,
                actionType,
                level,
                description: `API 호출: ${request.method} ${request.originalUrl}`,
                details: {
                    method: request.method,
                    url: request.originalUrl,
                    query: request.query,
                    body: this.sanitizeRequestBody(request.body),
                    headers: this.sanitizeHeaders(request.headers),
                },
                request,
                responseTime,
                statusCode,
                errorMessage: error?.message,
                errorStack: error?.stack,
            });
        } catch (logError) {
            this.logger.error('Failed to log API call', logError);
        }
    }

    /**
     * 에러 로그 기록
     */
    async logError(
        error: Error,
        context: string,
        userId?: string,
        resourceId?: string,
        details?: Record<string, any>
    ): Promise<void> {
        // UserLog 저장을 완전히 비활성화하여 메타데이터 오류 방지
        this.logger.error(`[${context}] ${error.message}`, error.stack);
        return;


        /* 원래 코드는 주석 처리
         try {
             if (userId) {
                 const userLog = new UserLog();
             if (!this.loggingConfig.isErrorLoggingEnabled()) {
                 return;
             }

             await this.logUserActivity({
                 userId,
                 actionType: UserActionType.ERROR_OCCURRED,
                 level: LogLevel.ERROR,
                 description: `오류 발생: ${error.message}`,
                 details: {
                     context,
                     errorName: error.name,
                     errorMessage: error.message,
                     stack: error.stack,
                     ...additionalDetails,
                 },
                 request,
                 errorMessage: error.message,
                 errorStack: error.stack,
             });
         } catch (logError) {
             this.logger.error('Failed to log error', logError);
         }
        */
    }


    /**
     * 보안 이벤트 로그 기록
     */
    async logSecurityEvent(
        eventDescription: string,
        userId?: string,
        request?: Request,
        details?: Record<string, any>,
    ): Promise<void> {
        try {
            await this.logUserActivity({
                userId,
                actionType: UserActionType.SECURITY_EVENT,
                level: LogLevel.WARN,
                description: `보안 이벤트: ${eventDescription}`,
                details,
                request,
            });
        } catch (error) {
            this.logger.error('Failed to log security event', error);
        }
    }

    /**
     * 사용자 인증 로그 기록
     */
    async logAuthEvent(
        actionType: UserActionType.LOGIN | UserActionType.LOGOUT | UserActionType.REGISTER,
        userId: string,
        request?: Request,
        success: boolean = true,
        errorMessage?: string,
    ): Promise<void> {
        try {
            const descriptions = {
                [UserActionType.LOGIN]: success ? '로그인 성공' : '로그인 실패',
                [UserActionType.LOGOUT]: '로그아웃',
                [UserActionType.REGISTER]: success ? '회원가입 성공' : '회원가입 실패',
            };

            await this.logUserActivity({
                userId,
                actionType,
                level: success ? LogLevel.INFO : LogLevel.WARN,
                description: descriptions[actionType],
                details: {
                    success,
                    timestamp: new Date().toISOString(),
                },
                request,
                errorMessage: success ? undefined : errorMessage,
            });
        } catch (error) {
            this.logger.error('Failed to log auth event', error);
        }
    }

    /**
     * 성능 로그 기록
     */
    async logPerformance(
        operation: string,
        duration: number,
        userId?: string,
        details?: Record<string, any>,
    ): Promise<void> {
        try {
            // if (!this.loggingConfig.isPerformanceLoggingEnabled()) {
            //     return;
            // }

            const level = duration > 1000 ? LogLevel.WARN : LogLevel.DEBUG;

            await this.logUserActivity({
                userId,
                actionType: UserActionType.API_ACCESS,
                level,
                description: `성능 측정: ${operation} (${duration}ms)`,
                details: {
                    operation,
                    duration,
                    ...details,
                },
                responseTime: duration,
            });
        } catch (error) {
            this.logger.error('Failed to log performance', error);
        }
    }

    private extractIpAddress(request?: Request): string {
        if (!request) return 'unknown';

        const forwarded = request.headers['x-forwarded-for'];
        const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded;

        return (
            forwardedIp?.split(',')[0] ||
            (request.headers['x-real-ip'] as string) ||
            request.connection?.remoteAddress ||
            request.socket?.remoteAddress ||
            'unknown'
        );
    }

    private determineLogLevel(statusCode: number, error?: Error): LogLevel {
        if (error || statusCode >= 500) {
            return LogLevel.ERROR;
        }
        if (statusCode >= 400) {
            return LogLevel.WARN;
        }
        return LogLevel.INFO;
    }

    private sanitizeRequestBody(body: any): any {
        if (!body) return body;

        const sanitized = { ...body };
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];

        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '***REDACTED***';
            }
        }

        return sanitized;
    }

    private sanitizeHeaders(headers: any): any {
        if (!headers) return headers;

        const sanitized = { ...headers };
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

        for (const header of sensitiveHeaders) {
            if (sanitized[header]) {
                sanitized[header] = '***REDACTED***';
            }
        }

        return sanitized;
    }

    private logToConsole(logData: CreateUserLogRequest): void {
        const logMessage = `[${logData.level}] ${logData.actionType} - ${logData.description}`;

        switch (logData.level) {
            case LogLevel.ERROR:
                this.logger.error(logMessage, logData.details);
                break;
            case LogLevel.WARN:
                this.logger.warn(logMessage, logData.details);
                break;
            case LogLevel.DEBUG:
                this.logger.debug(logMessage, logData.details);
                break;
            default:
                this.logger.log(logMessage, logData.details);
        }
    }
}
