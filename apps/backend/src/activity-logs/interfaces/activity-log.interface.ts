import { Filter, PaginatedResult, PaginationOptions } from '@/common/interfaces/pagination.interface';
import { ActivityLog } from '../entities/activity-log.entity';

export interface CreateActivityLogRequest {
    userId: string;
    action: string;
    description?: string;
    resourceType: string;
    resourceId?: string;
    entityId?: string;
    entityType?: string;
    details?: any;
    metadata?: any;
    projectId?: string;
}

export interface ActivityLogFilter extends Filter {
    userId?: string;
    projectId?: string;
    action?: string;
    resourceType?: string;
    entityType?: string;
    entityId?: string;
}

export interface ActivityLogPaginationOptions extends PaginationOptions {
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedActivityLogResult extends PaginatedResult<ActivityLog> { }
