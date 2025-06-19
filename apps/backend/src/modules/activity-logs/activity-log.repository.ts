import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { ActivityLogFilter, ActivityLogPaginationOptions, CreateActivityLogRequest, PaginatedActivityLogResult } from './interfaces/activity-log.interface';

@Injectable()
export class ActivityLogRepository {
    private readonly logger = new Logger(ActivityLogRepository.name);

    constructor(
        @InjectRepository(ActivityLog)
        private readonly repository: Repository<ActivityLog>,
    ) { }

    async create(request: CreateActivityLogRequest): Promise<ActivityLog> {
        try {
            const activityLog = new ActivityLog();
            Object.assign(activityLog, request);
            return await this.repository.save(activityLog);
        } catch (error) {
            this.logger.error('Failed to create activity log', error);
            throw error;
        }
    }

    async createMany(requests: CreateActivityLogRequest[]): Promise<ActivityLog[]> {
        try {
            const activityLogs = requests.map(request => {
                const log = new ActivityLog();
                Object.assign(log, request);
                return log;
            });
            return await this.repository.save(activityLogs);
        } catch (error) {
            this.logger.error('Failed to create multiple activity logs', error);
            throw error;
        }
    }

    async findById(id: string): Promise<ActivityLog | null> {
        try {
            return await this.repository.findOne({
                where: { id },
                relations: ['user', 'project'],
            });
        } catch (error) {
            this.logger.error(`Failed to find activity log by id: ${id}`, error);
            throw error;
        }
    }

    async findMany(options: ActivityLogFilter & ActivityLogPaginationOptions): Promise<PaginatedActivityLogResult> {
        const {
            projectId,
            userId,
            entityType,
            action,
            startDate,
            endDate,
            page = 1,
            limit = 20,
        } = options;

        const queryBuilder = this.repository.createQueryBuilder('activityLog');

        // Apply filters
        if (projectId) {
            queryBuilder.andWhere('activityLog.projectId = :projectId', { projectId });
        }

        if (userId) {
            queryBuilder.andWhere('activityLog.userId = :userId', { userId });
        }

        if (entityType) {
            queryBuilder.andWhere('activityLog.entityType = :entityType', { entityType });
        }

        if (action) {
            queryBuilder.andWhere('activityLog.action = :action', { action });
        }

        if (startDate) {
            queryBuilder.andWhere('activityLog.createdAt >= :startDate', { startDate });
        }

        if (endDate) {
            queryBuilder.andWhere('activityLog.createdAt <= :endDate', { endDate });
        }

        // Add joins
        queryBuilder
            .leftJoinAndSelect('activityLog.user', 'user')
            .leftJoinAndSelect('activityLog.project', 'project');

        // Add ordering
        queryBuilder.orderBy('activityLog.createdAt', 'DESC');

        // Add pagination
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findByProjectId(
        projectId: string,
        options: ActivityLogPaginationOptions,
    ): Promise<PaginatedActivityLogResult> {
        return this.findMany({ projectId, ...options });
    }

    async findByUserId(
        userId: string,
        options: ActivityLogPaginationOptions,
    ): Promise<PaginatedActivityLogResult> {
        return this.findMany({ userId, ...options });
    }

    async findRecent(projectId?: string, limit: number = 10): Promise<ActivityLog[]> {
        try {
            const queryBuilder = this.repository
                .createQueryBuilder('activityLog')
                .leftJoinAndSelect('activityLog.user', 'user')
                .leftJoinAndSelect('activityLog.project', 'project');

            if (projectId) {
                queryBuilder.where('activityLog.projectId = :projectId', { projectId });
            }

            queryBuilder
                .orderBy('activityLog.createdAt', 'DESC')
                .take(limit);

            return await queryBuilder.getMany();
        } catch (error) {
            this.logger.error('Failed to find recent activity logs', error);
            throw error;
        }
    }

    async deleteOldLogs(olderThanDays: number): Promise<number> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

            const result = await this.repository.delete({
                createdAt: LessThan(cutoffDate),
            });

            return result.affected || 0;
        } catch (error) {
            this.logger.error(`Failed to delete old activity logs older than ${olderThanDays} days`, error);
            throw error;
        }
    }

    async getActivityLogs(filters: {
        projectId?: string;
        userId?: string;
        entityType?: string;
        limit?: number;
        offset?: number;
    }): Promise<ActivityLog[]> {
        const queryBuilder = this.repository.createQueryBuilder('activityLog');

        if (filters.projectId) {
            queryBuilder.andWhere('activityLog.projectId = :projectId', { projectId: filters.projectId });
        }

        if (filters.userId) {
            queryBuilder.andWhere('activityLog.userId = :userId', { userId: filters.userId });
        }

        if (filters.entityType) {
            queryBuilder.andWhere('activityLog.entityType = :entityType', { entityType: filters.entityType });
        }

        queryBuilder
            .leftJoinAndSelect('activityLog.user', 'user')
            .leftJoinAndSelect('activityLog.project', 'project')
            .orderBy('activityLog.createdAt', 'DESC')
            .take(filters.limit || 50)
            .skip(filters.offset || 0);

        return await queryBuilder.getMany();
    }

    async searchActivityLogs(query: string, filters: {
        projectId?: string;
        userId?: string;
        limit?: number;
    }): Promise<ActivityLog[]> {
        const queryBuilder = this.repository.createQueryBuilder('activityLog');

        queryBuilder.where(
            '(activityLog.description ILIKE :query OR activityLog.action ILIKE :query)',
            { query: `%${query}%` }
        );

        if (filters.projectId) {
            queryBuilder.andWhere('activityLog.projectId = :projectId', { projectId: filters.projectId });
        }

        if (filters.userId) {
            queryBuilder.andWhere('activityLog.userId = :userId', { userId: filters.userId });
        }

        queryBuilder
            .leftJoinAndSelect('activityLog.user', 'user')
            .leftJoinAndSelect('activityLog.project', 'project')
            .orderBy('activityLog.createdAt', 'DESC')
            .take(filters.limit || 50);

        return await queryBuilder.getMany();
    }
}
