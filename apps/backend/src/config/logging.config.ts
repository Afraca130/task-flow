import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export enum LoggerLevel {
    ERROR = 'error',
    WARN = 'warn',
    LOG = 'log',
    DEBUG = 'debug',
    VERBOSE = 'verbose',
}

export interface LoggingConfig {
    level: LoggerLevel;
    timestamp: boolean;
    context: boolean;
    prettyPrint: boolean;
    logToFile: boolean;
    logFilePath: string;
    maxFileSize: string;
    maxFiles: number;
    enableUserActivityLogging: boolean;
    enableAPILogging: boolean;
    enableDatabaseLogging: boolean;
    enableErrorLogging: boolean;
    enablePerformanceLogging: boolean;
}

/**
 * 로깅 설정 서비스
 */
@Injectable()
export class LoggingConfigService {
    constructor(private readonly configService: ConfigService) { }

    getLoggingConfig(): LoggingConfig {
        const isDevelopment = this.configService.get('NODE_ENV') !== 'production';

        return {
            level: this.configService.get<LoggerLevel>('LOG_LEVEL', isDevelopment ? LoggerLevel.DEBUG : LoggerLevel.ERROR),
            timestamp: this.configService.get<boolean>('LOG_TIMESTAMP', true),
            context: this.configService.get<boolean>('LOG_CONTEXT', true),
            prettyPrint: this.configService.get<boolean>('LOG_PRETTY_PRINT', isDevelopment),
            logToFile: this.configService.get<boolean>('LOG_TO_FILE', true),
            logFilePath: this.configService.get<string>('LOG_FILE_PATH', './logs'),
            maxFileSize: this.configService.get<string>('LOG_MAX_FILE_SIZE', '20m'),
            maxFiles: this.configService.get<number>('LOG_MAX_FILES', 14),
            enableUserActivityLogging: this.configService.get<boolean>('ENABLE_USER_ACTIVITY_LOGGING', true),
            enableAPILogging: this.configService.get<boolean>('ENABLE_API_LOGGING', true),
            enableDatabaseLogging: this.configService.get<boolean>('ENABLE_DATABASE_LOGGING', isDevelopment),
            enableErrorLogging: this.configService.get<boolean>('ENABLE_ERROR_LOGGING', true),
            enablePerformanceLogging: this.configService.get<boolean>('ENABLE_PERFORMANCE_LOGGING', true),
        };
    }

    /**
     * 로그 레벨 검증
     */
    isLogLevelEnabled(level: LoggerLevel): boolean {
        const config = this.getLoggingConfig();
        const levels = [LoggerLevel.ERROR, LoggerLevel.WARN, LoggerLevel.LOG, LoggerLevel.DEBUG, LoggerLevel.VERBOSE];
        const currentLevelIndex = levels.indexOf(config.level);
        const checkLevelIndex = levels.indexOf(level);

        return checkLevelIndex <= currentLevelIndex;
    }

    /**
     * 사용자 활동 로깅 활성화 여부
     */
    isUserActivityLoggingEnabled(): boolean {
        return this.getLoggingConfig().enableUserActivityLogging;
    }

    /**
     * API 로깅 활성화 여부
     */
    isAPILoggingEnabled(): boolean {
        return this.getLoggingConfig().enableAPILogging;
    }

    /**
     * 데이터베이스 로깅 활성화 여부
     */
    isDatabaseLoggingEnabled(): boolean {
        return this.getLoggingConfig().enableDatabaseLogging;
    }

    /**
     * 에러 로깅 활성화 여부
     */
    isErrorLoggingEnabled(): boolean {
        return this.getLoggingConfig().enableErrorLogging;
    }

    /**
     * 성능 로깅 활성화 여부
     */
    isPerformanceLoggingEnabled(): boolean {
        return this.getLoggingConfig().enablePerformanceLogging;
    }
}
