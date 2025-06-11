import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Like, Repository } from 'typeorm';
import {
    CreateUserLogRequest,
    PaginatedUserLogResult,
    UserLogFilter,
    UserLogPaginationOptions,
    UserLogRepositoryPort,
    UserLogSummary,
} from '../../../application/ports/output/user-log-repository.port';
import { LogLevel, UserActionType, UserLog } from '../../../domain/entities/user-log.entity';

@Injectable()
export class UserLogRepository implements UserLogRepositoryPort {
    private readonly logger = new Logger(UserLogRepository.name);

    constructor(
        @InjectRepository(UserLog)
        private readonly userLogRepository: Repository<UserLog>,
    ) { }

    async create(request: CreateUserLogRequest): Promise<UserLog> {
        try {
            const userLog = new UserLog({
                ...request,
                level: request.level || LogLevel.INFO,
            });

            return await this.userLogRepository.save(userLog);
        } catch (error) {
            this.logger.error('Failed to create user log', error);
            throw error;
        }
    }

    async createMany(requests: CreateUserLogRequest[]): Promise<UserLog[]> {
        try {
            const userLogs = requests.map(request => new UserLog({
                ...request,
                level: request.level || LogLevel.INFO,
            }));

            return await this.userLogRepository.save(userLogs);
        } catch (error) {
            this.logger.error('Failed to create multiple user logs', error);
            throw error;
        }
    }

    async findById(id: string): Promise<UserLog | null> {
        try {
            return await this.userLogRepository.findOne({ where: { id } });
        } catch (error) {
            this.logger.error(`Failed to find user log by id: ${id}`, error);
            throw error;
        }
    }

    async findMany(
        filter: UserLogFilter,
        options: UserLogPaginationOptions,
    ): Promise<PaginatedUserLogResult> {
        try {
            const whereConditions = this.buildWhereConditions(filter);
            const { sortBy = 'createdAt', sortOrder = 'DESC' } = options;

            const [data, total] = await this.userLogRepository.findAndCount({
                where: whereConditions,
                order: { [sortBy]: sortOrder },
                skip: (options.page - 1) * options.limit,
                take: options.limit,
            });

            return {
                data,
                total,
                page: options.page,
                limit: options.limit,
                totalPages: Math.ceil(total / options.limit),
            };
        } catch (error) {
            this.logger.error('Failed to find user logs', error);
            throw error;
        }
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
        try {
            const whereConditions = this.buildWhereConditions(filter);
            const dateRange = this.getDateRange(period);

            if (dateRange) {
                whereConditions.createdAt = dateRange;
            }

            const [
                totalLogs,
                logsByLevel,
                logsByActionType,
                topUsers,
                topIpAddresses,
                errorLogs,
                avgResponseTime,
            ] = await Promise.all([
                this.userLogRepository.count({ where: whereConditions }),
                this.getLogCountByLevel(whereConditions),
                this.getLogCountByActionType(whereConditions),
                this.getTopUsers(whereConditions),
                this.getTopIpAddresses(whereConditions),
                this.userLogRepository.count({
                    where: { ...whereConditions, level: LogLevel.ERROR }
                }),
                this.getAverageResponseTime(whereConditions),
            ]);

            return {
                totalLogs,
                logsByLevel,
                logsByActionType,
                topUsers,
                topIpAddresses,
                errorRate: totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0,
                averageResponseTime: avgResponseTime,
            };
        } catch (error) {
            this.logger.error('Failed to get user log summary', error);
            throw error;
        }
    }

    async getErrorLogs(
        filter: UserLogFilter,
        options: UserLogPaginationOptions,
    ): Promise<PaginatedUserLogResult> {
        return this.findMany(
            { ...filter, level: LogLevel.ERROR },
            options,
        );
    }

    async getSecurityLogs(
        filter: UserLogFilter,
        options: UserLogPaginationOptions,
    ): Promise<PaginatedUserLogResult> {
        return this.findMany(
            {
                ...filter,
                actionType: In([
                    UserActionType.LOGIN,
                    UserActionType.LOGOUT,
                    UserActionType.REGISTER,
                    UserActionType.PASSWORD_CHANGE,
                    UserActionType.SECURITY_EVENT,
                ]) as any,
            },
            options,
        );
    }

    async getUserActivityTimeline(
        userId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<UserLog[]> {
        try {
            return await this.userLogRepository.find({
                where: {
                    userId,
                    createdAt: Between(startDate, endDate),
                },
                order: { createdAt: 'DESC' },
            });
        } catch (error) {
            this.logger.error(`Failed to get user activity timeline for user: ${userId}`, error);
            throw error;
        }
    }

    async deleteOldLogs(olderThanDays: number): Promise<number> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

            const result = await this.userLogRepository.delete({
                createdAt: Between(new Date('1970-01-01'), cutoffDate),
            });

            return result.affected || 0;
        } catch (error) {
            this.logger.error(`Failed to delete old logs older than ${olderThanDays} days`, error);
            throw error;
        }
    }

    async getLogStatistics(
        period: 'hour' | 'day' | 'week' | 'month',
        startDate: Date,
        endDate: Date,
    ): Promise<Array<{ date: string; count: number; level: LogLevel }>> {
        try {
            const dateFormat = this.getDateFormat(period);

            const result = await this.userLogRepository
                .createQueryBuilder('log')
                .select([
                    `DATE_TRUNC('${period}', log.createdAt) as date`,
                    'log.level as level',
                    'COUNT(*) as count',
                ])
                .where('log.createdAt BETWEEN :startDate AND :endDate', {
                    startDate,
                    endDate,
                })
                .groupBy('date, log.level')
                .orderBy('date', 'ASC')
                .getRawMany();

            return result.map(row => ({
                date: row.date.toISOString(),
                count: parseInt(row.count),
                level: row.level,
            }));
        } catch (error) {
            this.logger.error('Failed to get log statistics', error);
            throw error;
        }
    }

    private buildWhereConditions(filter: UserLogFilter): any {
        const conditions: any = {};

        if (filter.userId) {
            conditions.userId = filter.userId;
        }

        if (filter.actionType) {
            conditions.actionType = filter.actionType;
        }

        if (filter.level) {
            conditions.level = filter.level;
        }

        if (filter.resourceType) {
            conditions.resourceType = filter.resourceType;
        }

        if (filter.ipAddress) {
            conditions.ipAddress = filter.ipAddress;
        }

        if (filter.startDate && filter.endDate) {
            conditions.createdAt = Between(filter.startDate, filter.endDate);
        }

        if (filter.search) {
            conditions.description = Like(`%${filter.search}%`);
        }

        return conditions;
    }

    private getDateRange(period: 'day' | 'week' | 'month'): any {
        const now = new Date();
        const startDate = new Date();

        switch (period) {
            case 'day':
                startDate.setDate(now.getDate() - 1);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
        }

        return Between(startDate, now);
    }

    private async getLogCountByLevel(whereConditions: any): Promise<Record<LogLevel, number>> {
        const result = await this.userLogRepository
            .createQueryBuilder('log')
            .select('log.level', 'level')
            .addSelect('COUNT(*)', 'count')
            .where(whereConditions)
            .groupBy('log.level')
            .getRawMany();

        const counts: Record<LogLevel, number> = {
            [LogLevel.INFO]: 0,
            [LogLevel.WARN]: 0,
            [LogLevel.ERROR]: 0,
            [LogLevel.DEBUG]: 0,
        };

        result.forEach(row => {
            counts[row.level as LogLevel] = parseInt(row.count);
        });

        return counts;
    }

    private async getLogCountByActionType(whereConditions: any): Promise<Record<UserActionType, number>> {
        const result = await this.userLogRepository
            .createQueryBuilder('log')
            .select('log.actionType', 'actionType')
            .addSelect('COUNT(*)', 'count')
            .where(whereConditions)
            .groupBy('log.actionType')
            .getRawMany();

        const counts: Record<UserActionType, number> = Object.values(UserActionType).reduce(
            (acc, actionType) => ({ ...acc, [actionType]: 0 }),
            {} as Record<UserActionType, number>,
        );

        result.forEach(row => {
            counts[row.actionType as UserActionType] = parseInt(row.count);
        });

        return counts;
    }

    private async getTopUsers(whereConditions: any): Promise<Array<{ userId: string; count: number }>> {
        const result = await this.userLogRepository
            .createQueryBuilder('log')
            .select('log.userId', 'userId')
            .addSelect('COUNT(*)', 'count')
            .where(whereConditions)
            .andWhere('log.userId IS NOT NULL')
            .groupBy('log.userId')
            .orderBy('count', 'DESC')
            .limit(10)
            .getRawMany();

        return result.map(row => ({
            userId: row.userId,
            count: parseInt(row.count),
        }));
    }

    private async getTopIpAddresses(whereConditions: any): Promise<Array<{ ipAddress: string; count: number }>> {
        const result = await this.userLogRepository
            .createQueryBuilder('log')
            .select('log.ipAddress', 'ipAddress')
            .addSelect('COUNT(*)', 'count')
            .where(whereConditions)
            .groupBy('log.ipAddress')
            .orderBy('count', 'DESC')
            .limit(10)
            .getRawMany();

        return result.map(row => ({
            ipAddress: row.ipAddress,
            count: parseInt(row.count),
        }));
    }

    private async getAverageResponseTime(whereConditions: any): Promise<number> {
        const result = await this.userLogRepository
            .createQueryBuilder('log')
            .select('AVG(log.responseTime)', 'avgResponseTime')
            .where(whereConditions)
            .andWhere('log.responseTime IS NOT NULL')
            .getRawOne();

        return result?.avgResponseTime ? parseFloat(result.avgResponseTime) : 0;
    }

    private getDateFormat(period: 'hour' | 'day' | 'week' | 'month'): string {
        switch (period) {
            case 'hour':
                return 'YYYY-MM-DD HH24:00:00';
            case 'day':
                return 'YYYY-MM-DD';
            case 'week':
                return 'YYYY-"W"WW';
            case 'month':
                return 'YYYY-MM';
            default:
                return 'YYYY-MM-DD';
        }
    }
}
