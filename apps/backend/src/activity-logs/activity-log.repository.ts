import { ActivityLogFilter, ActivityLogPaginationOptions, ActivityLogRepositoryPort, CreateActivityLogRequest, PaginatedActivityLogResult } from './interfaces/activity-log-repository.port';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';


@Injectable()
export class ActivityLogRepository implements ActivityLogRepositoryPort {
    private readonly logger = new Logger(ActivityLogRepository.name);

    constructor(
        @InjectRepository(ActivityLog)
        private readonly activityLogRepository: Repository<ActivityLog>,
    ) { }

    async create(request: CreateActivityLogRequest): Promise<ActivityLog> {
        try {
            const activityLog = new ActivityLog();
            Object.assign(activityLog, request);
            return await this.activityLogRepository.save(activityLog);
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
            return await this.activityLogRepository.save(activityLogs);
        } catch (error) {
            this.logger.error('Failed to create multiple activity logs', error);
            throw error;
        }
    }

    async findById(id: string): Promise<ActivityLog | null> {
        try {
            return await this.activityLogRepository.findOne({
                where: { id },
                relations: ['user', 'project'],
            });
        } catch (error) {
            this.logger.error(`Failed to find activity log by id: ${id}`, error);
            throw error;
        }
    }

    async findMany(
        filter: ActivityLogFilter & ActivityLogPaginationOptions,
    ): Promise<PaginatedActivityLogResult> {
        try {
            const { page, limit, sortBy = 'timestamp', sortOrder = 'DESC', ...filterOptions } = filter;
            const skip = (page - 1) * limit;

            const queryBuilder = this.activityLogRepository
                .createQueryBuilder('activityLog')
                .leftJoinAndSelect('activityLog.user', 'user')
                .leftJoinAndSelect('activityLog.project', 'project');

            // Apply filters
            if (filterOptions.projectId) {
                queryBuilder.andWhere('activityLog.projectId = :projectId', {
                    projectId: filterOptions.projectId,
                });
            }

            if (filterOptions.userId) {
                queryBuilder.andWhere('activityLog.userId = :userId', {
                    userId: filterOptions.userId,
                });
            }

            if (filterOptions.entityType) {
                queryBuilder.andWhere('activityLog.entityType = :entityType', {
                    entityType: filterOptions.entityType,
                });
            }

            if (filterOptions.entityId) {
                queryBuilder.andWhere('activityLog.entityId = :entityId', {
                    entityId: filterOptions.entityId,
                });
            }

            if (filterOptions.action) {
                queryBuilder.andWhere('activityLog.action = :action', {
                    action: filterOptions.action,
                });
            }

            if (filterOptions.startDate) {
                queryBuilder.andWhere('activityLog.timestamp >= :startDate', {
                    startDate: filterOptions.startDate,
                });
            }

            if (filterOptions.endDate) {
                queryBuilder.andWhere('activityLog.timestamp <= :endDate', {
                    endDate: filterOptions.endDate,
                });
            }

            // Apply sorting
            queryBuilder.orderBy(`activityLog.${sortBy}`, sortOrder);

            // Apply pagination
            queryBuilder.skip(skip).take(limit);

            const [data, total] = await queryBuilder.getManyAndCount();

            return {
                data,
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            };
        } catch (error) {
            this.logger.error('Failed to find activity logs', error);
            throw error;
        }
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
            const queryBuilder = this.activityLogRepository
                .createQueryBuilder('activityLog')
                .leftJoinAndSelect('activityLog.user', 'user')
                .leftJoinAndSelect('activityLog.project', 'project');

            if (projectId) {
                queryBuilder.where('activityLog.projectId = :projectId', { projectId });
            }

            queryBuilder
                .orderBy('activityLog.timestamp', 'DESC')
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

            const result = await this.activityLogRepository.delete({
                timestamp: LessThan(cutoffDate),
            });

            return result.affected || 0;
        } catch (error) {
            this.logger.error(`Failed to delete old activity logs older than ${olderThanDays} days`, error);
            throw error;
        }
    }
}
