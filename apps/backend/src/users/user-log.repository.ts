import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { LogLevel, UserActionType, UserLog } from './entities/user-log.entity';
import {
    CreateUserLogRequest,
    PaginatedUserLogResult,
    UserLogFilter,
    UserLogPaginationOptions,
    UserLogSummary,
} from './interfaces/user-log.interface';

@Injectable()
export class UserLogRepository {
    constructor(
        @InjectRepository(UserLog)
        private readonly repository: Repository<UserLog>,
    ) { }

    async create(request: CreateUserLogRequest): Promise<UserLog> {
        const userLog = this.repository.create(request);
        return await this.repository.save(userLog);
    }

    async createMany(requests: CreateUserLogRequest[]): Promise<UserLog[]> {
        const userLogs = requests.map(request => this.repository.create(request));
        return await this.repository.save(userLogs);
    }

    async findById(id: string): Promise<UserLog | null> {
        return await this.repository.findOne({ where: { id } });
    }

    async findMany(
        filter: UserLogFilter,
        options: UserLogPaginationOptions,
    ): Promise<PaginatedUserLogResult> {
        const { page = 1, limit = 10 } = options;
        const skip = (page - 1) * limit;

        const where = this.buildWhereClause(filter);

        const [data, total] = await this.repository.findAndCount({
            where,
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            total,
            page,
            limit,
            totalPages,
        };
    }

    async findByUserId(
        userId: string,
        options: UserLogPaginationOptions,
    ): Promise<PaginatedUserLogResult> {
        return this.findMany({ userId }, options);
    }

    async getSummary(
        filter: UserLogFilter,
        period: 'day' | 'week' | 'month',
    ): Promise<UserLogSummary> {
        const where = this.buildWhereClause(filter);

        const [totalLogs, errorCount, warningCount, infoCount, debugCount] = await Promise.all([
            this.repository.count({ where }),
            this.repository.count({ where: { ...where, level: LogLevel.ERROR } }),
            this.repository.count({ where: { ...where, level: LogLevel.WARN } }),
            this.repository.count({ where: { ...where, level: LogLevel.INFO } }),
            this.repository.count({ where: { ...where, level: LogLevel.DEBUG } }),
        ]);

        // These would require more complex queries in a real implementation
        const mostActiveUsers: any[] = [];
        const commonActions: any[] = [];
        const errorBreakdown: any[] = [];

        return {
            totalLogs,
            errorCount,
            warningCount,
            infoCount,
            debugCount,
            mostActiveUsers,
            commonActions,
            errorBreakdown,
        };
    }

    async getErrorLogs(
        filter: UserLogFilter,
        options: UserLogPaginationOptions,
    ): Promise<PaginatedUserLogResult> {
        return this.findMany({ ...filter, level: LogLevel.ERROR }, options);
    }

    async getSecurityLogs(
        filter: UserLogFilter,
        options: UserLogPaginationOptions,
    ): Promise<PaginatedUserLogResult> {
        // Assuming security actions are specific action types
        return this.findMany(
            { ...filter, actionType: UserActionType.LOGIN },
            options,
        );
    }

    async getUserActivityTimeline(
        userId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<UserLog[]> {
        return await this.repository.find({
            where: {
                userId,
                createdAt: Between(startDate, endDate),
            },
            order: { createdAt: 'ASC' },
        });
    }

    async deleteOldLogs(olderThanDays: number): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const result = await this.repository.delete({
            createdAt: Between(new Date('1970-01-01'), cutoffDate),
        });

        return result.affected || 0;
    }

    async getLogStatistics(
        period: 'hour' | 'day' | 'week' | 'month',
        startDate: Date,
        endDate: Date,
    ): Promise<Array<{ date: string; count: number; level: LogLevel }>> {
        // This would require a more complex query in a real implementation
        return [];
    }

    private buildWhereClause(filter: UserLogFilter): FindOptionsWhere<UserLog> {
        const where: FindOptionsWhere<UserLog> = {};

        if (filter.userId) {
            where.userId = filter.userId;
        }

        if (filter.actionType) {
            where.actionType = filter.actionType;
        }

        if (filter.level) {
            where.level = filter.level;
        }

        if (filter.resourceType) {
            where.resourceType = filter.resourceType;
        }

        if (filter.startDate && filter.endDate) {
            where.createdAt = Between(filter.startDate, filter.endDate);
        }

        return where;
    }
}
