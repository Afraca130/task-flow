import { LogLevel, UserActionType, UserLog } from "@/users/entities/user-log.entity";


export interface CreateUserLogRequest {
    userId?: string;
    sessionId?: string;
    actionType: UserActionType;
    level?: LogLevel;
    description: string;
    details?: Record<string, any>;
    resourceId?: string;
    resourceType?: string;
    ipAddress: string;
    userAgent?: string;
    method?: string;
    url?: string;
    statusCode?: number;
    responseTime?: number;
    errorMessage?: string;
    errorStack?: string;
}

export interface UserLogFilter {
    userId?: string;
    actionType?: UserActionType;
    level?: LogLevel;
    resourceType?: string;
    ipAddress?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
}

export interface UserLogSummary {
    totalLogs: number;
    logsByLevel: Record<LogLevel, number>;
    logsByActionType: Record<UserActionType, number>;
    topUsers: Array<{ userId: string; count: number }>;
    topIpAddresses: Array<{ ipAddress: string; count: number }>;
    errorRate: number;
    averageResponseTime: number;
}

export interface UserLogPaginationOptions {
    page: number;
    limit: number;
    sortBy?: keyof UserLog;
    sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedUserLogResult {
    data: UserLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export abstract class UserLogRepositoryPort {
    abstract create(request: CreateUserLogRequest): Promise<UserLog>;
    abstract createMany(requests: CreateUserLogRequest[]): Promise<UserLog[]>;
    abstract findById(id: string): Promise<UserLog | null>;
    abstract findMany(
        filter: UserLogFilter,
        options: UserLogPaginationOptions,
    ): Promise<PaginatedUserLogResult>;
    abstract findByUserId(
        userId: string,
        options: UserLogPaginationOptions,
    ): Promise<PaginatedUserLogResult>;
    abstract getSummary(
        filter: UserLogFilter,
        period: 'day' | 'week' | 'month',
    ): Promise<UserLogSummary>;
    abstract getErrorLogs(
        filter: UserLogFilter,
        options: UserLogPaginationOptions,
    ): Promise<PaginatedUserLogResult>;
    abstract getSecurityLogs(
        filter: UserLogFilter,
        options: UserLogPaginationOptions,
    ): Promise<PaginatedUserLogResult>;
    abstract getUserActivityTimeline(
        userId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<UserLog[]>;
    abstract deleteOldLogs(olderThanDays: number): Promise<number>;
    abstract getLogStatistics(
        period: 'hour' | 'day' | 'week' | 'month',
        startDate: Date,
        endDate: Date,
    ): Promise<Array<{ date: string; count: number; level: LogLevel }>>;
}
