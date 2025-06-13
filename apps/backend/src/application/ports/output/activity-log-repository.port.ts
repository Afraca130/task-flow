import { ActivityLog, EntityType } from '../../../domain/entities/activity-log.entity';

export interface ActivityLogFilter {
    projectId?: string;
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
}

export interface ActivityLogPaginationOptions {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedActivityLogResult {
    data: ActivityLog[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface CreateActivityLogRequest {
    userId: string;
    projectId: string;
    entityId: string;
    entityType: EntityType;
    action: string;
    description: string;
    metadata?: Record<string, any>;
}

export abstract class ActivityLogRepositoryPort {
    abstract create(request: CreateActivityLogRequest): Promise<ActivityLog>;
    abstract createMany(requests: CreateActivityLogRequest[]): Promise<ActivityLog[]>;
    abstract findById(id: string): Promise<ActivityLog | null>;
    abstract findMany(
        filter: ActivityLogFilter & ActivityLogPaginationOptions,
    ): Promise<PaginatedActivityLogResult>;
    abstract findByProjectId(
        projectId: string,
        options: ActivityLogPaginationOptions,
    ): Promise<PaginatedActivityLogResult>;
    abstract findByUserId(
        userId: string,
        options: ActivityLogPaginationOptions,
    ): Promise<PaginatedActivityLogResult>;
    abstract findRecent(
        projectId?: string,
        limit?: number,
    ): Promise<ActivityLog[]>;
    abstract deleteOldLogs(olderThanDays: number): Promise<number>;
}
