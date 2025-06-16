import { ActivityLog, EntityType } from "../entities/activity-log.entity";

/**
 * 활동 로그 생성 요청
 */
export interface CreateActivityLogRequest {
    userId: string;
    actionType?: string;
    action?: string;
    description: string;
    projectId?: string;
    resourceId?: string;
    resourceType?: EntityType;
    entityId?: string;
    entityType?: EntityType;
    details?: Record<string, any>;
    metadata?: Record<string, any>;
}

/**
 * 활동 로그 필터
 */
export interface ActivityLogFilter {
    userId?: string;
    actionType?: string;
    projectId?: string;
    resourceType?: EntityType | string;
    resourceId?: string;
    entityType?: EntityType | string;
    entityId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
}

/**
 * 활동 로그 페이지네이션 옵션
 */
export interface ActivityLogPaginationOptions {
    page: number;
    limit: number;
    sortBy?: 'createdAt' | 'actionType';
    sortOrder?: 'ASC' | 'DESC';
}

/**
 * 페이지네이션된 활동 로그 결과
 */
export interface PaginatedActivityLogResult {
    data: ActivityLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/**
 * 활동 로그 리포지토리 포트
 */
export interface ActivityLogRepositoryPort {
    /**
     * 활동 로그 생성
     */
    create(request: CreateActivityLogRequest): Promise<ActivityLog>;

    /**
     * 사용자별 활동 로그 조회
     */
    findByUserId(
        userId: string,
        options: ActivityLogPaginationOptions
    ): Promise<PaginatedActivityLogResult>;

    /**
     * 필터링된 활동 로그 조회
     */
    // findWithFilter(
    //     filter: ActivityLogFilter,
    //     options: ActivityLogPaginationOptions
    // ): Promise<PaginatedActivityLogResult>;

    /**
     * 리소스별 활동 로그 조회
     */
    // findByResource(
    //     resourceType: EntityType,
    //     resourceId: string,
    //     options: ActivityLogPaginationOptions
    // ): Promise<PaginatedActivityLogResult>;

    /**
     * 많은 조건으로 조회 (기존 호환성)
     */
    findMany(
        filter: ActivityLogFilter & ActivityLogPaginationOptions
    ): Promise<PaginatedActivityLogResult>;

    /**
     * 프로젝트별 활동 로그 조회
     */
    findByProjectId(
        projectId: string,
        options: ActivityLogPaginationOptions
    ): Promise<PaginatedActivityLogResult>;

    /**
     * 활동 로그 삭제 (관리자용)
     */
    // delete(id: string): Promise<void>;

    /**
     * 오래된 로그 정리 (배치 작업용)
     */
    // deleteOlderThan(date: Date): Promise<number>;
}
