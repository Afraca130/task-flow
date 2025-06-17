import { Filter, PaginatedResult, PaginationOptions } from '@/common/interfaces/pagination.interface';
import { LogLevel, UserActionType, UserLog } from '../entities/user-log.entity';

export interface CreateUserLogRequest {
    userId: string;
    sessionId?: string;
    actionType: UserActionType;
    level: LogLevel;
    description: string;
    resourceId?: string;
    resourceType?: string;
    details?: any;
    userAgent?: string;
    ipAddress?: string;
    metadata?: any;
}

export interface UserLogFilter extends Filter {
    userId?: string;
    actionType?: UserActionType;
    level?: LogLevel;
    resourceType?: string;
    ipAddress?: string;
}

export interface UserLogPaginationOptions extends PaginationOptions {
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedUserLogResult extends PaginatedResult<UserLog> { }

export interface UserLogSummary {
    totalLogs: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    debugCount: number;
    mostActiveUsers: Array<{
        userId: string;
        userName: string;
        logCount: number;
    }>;
    commonActions: Array<{
        actionType: UserActionType;
        count: number;
    }>;
    errorBreakdown: Array<{
        resourceType: string;
        errorCount: number;
    }>;
}
