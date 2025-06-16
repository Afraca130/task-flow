import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, Repository } from 'typeorm';
import { LogLevel, UserActionType, UserLog } from './entities/user-log.entity';
import {
    CreateUserLogRequest,
    PaginatedUserLogResult,
    UserLogFilter,
    UserLogPaginationOptions,
    UserLogRepositoryPort,
    UserLogSummary,
} from './interfaces/user-log-repository.port';

@Injectable()
export class UserLogRepository implements UserLogRepositoryPort {
    constructor(
        @InjectRepository(UserLog)
        private readonly repository: Repository<UserLog>,
    ) { }

    async create(request: CreateUserLogRequest): Promise<UserLog> {
        const userLog = this.repository.create({
            ...request,
            level: request.level || LogLevel.INFO,
        });
        return await this.repository.save(userLog);
    }

    async createMany(requests: CreateUserLogRequest[]): Promise<UserLog[]> {
        const userLogs = requests.map(request =>
            this.repository.create({
                ...request,
                level: request.level || LogLevel.INFO,
            })
        );
        return await this.repository.save(userLogs);
    }

    async findById(id: string): Promise<UserLog | null> {
        return await this.repository.findOne({ where: { id } });
    }

    async findMany(
        filter: UserLogFilter,
        options: UserLogPaginationOptions,
    ): Promise<PaginatedUserLogResult> {
        const queryBuilder = this.repository.createQueryBuilder('userLog');

        // 필터 적용
        this.applyFilters(queryBuilder, filter);

        // 정렬
        const sortBy = options.sortBy || 'createdAt';
        const sortOrder = options.sortOrder || 'DESC';
        queryBuilder.orderBy(`userLog.${sortBy}`, sortOrder);

        // 페이지네이션
        const skip = (options.page - 1) * options.limit;
        queryBuilder.skip(skip).take(options.limit);

        const [data, total] = await queryBuilder.getManyAndCount();
        const totalPages = Math.ceil(total / options.limit);

        return {
            data,
            total,
            page: options.page,
            limit: options.limit,
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
        const queryBuilder = this.repository.createQueryBuilder('userLog');
        this.applyFilters(queryBuilder, filter);

        // 기본 통계
        const totalLogs = await queryBuilder.getCount();

        // 레벨별 통계
        const logsByLevelQuery = this.repository.createQueryBuilder('userLog');
        this.applyFilters(logsByLevelQuery, filter);
        const logsByLevelRaw = await logsByLevelQuery
            .select('userLog.level', 'level')
            .addSelect('COUNT(*)', 'count')
            .groupBy('userLog.level')
            .getRawMany();

        const logsByLevel = Object.values(LogLevel).reduce((acc, level) => {
            acc[level] = 0;
            return acc;
        }, {} as Record<LogLevel, number>);

        logsByLevelRaw.forEach(item => {
            logsByLevel[item.level as LogLevel] = parseInt(item.count);
        });

        // 액션 타입별 통계
        const logsByActionTypeQuery = this.repository.createQueryBuilder('userLog');
        this.applyFilters(logsByActionTypeQuery, filter);
        const logsByActionTypeRaw = await logsByActionTypeQuery
            .select('userLog.actionType', 'actionType')
            .addSelect('COUNT(*)', 'count')
            .groupBy('userLog.actionType')
            .getRawMany();

        const logsByActionType = Object.values(UserActionType).reduce((acc, actionType) => {
            acc[actionType] = 0;
            return acc;
        }, {} as Record<UserActionType, number>);

        logsByActionTypeRaw.forEach(item => {
            logsByActionType[item.actionType as UserActionType] = parseInt(item.count);
        });

        // 상위 사용자
        const topUsersQuery = this.repository.createQueryBuilder('userLog');
        this.applyFilters(topUsersQuery, filter);
        const topUsers = await topUsersQuery
            .select('userLog.userId', 'userId')
            .addSelect('COUNT(*)', 'count')
            .where('userLog.userId IS NOT NULL')
            .groupBy('userLog.userId')
            .orderBy('COUNT(*)', 'DESC')
            .limit(10)
            .getRawMany();

        // 상위 IP 주소
        const topIpAddressesQuery = this.repository.createQueryBuilder('userLog');
        this.applyFilters(topIpAddressesQuery, filter);
        const topIpAddresses = await topIpAddressesQuery
            .select('userLog.ipAddress', 'ipAddress')
            .addSelect('COUNT(*)', 'count')
            .groupBy('userLog.ipAddress')
            .orderBy('COUNT(*)', 'DESC')
            .limit(10)
            .getRawMany();

        // 에러율 계산
        const errorCount = logsByLevel[LogLevel.ERROR] || 0;
        const errorRate = totalLogs > 0 ? (errorCount / totalLogs) * 100 : 0;

        // 평균 응답 시간
        const avgResponseTimeQuery = this.repository.createQueryBuilder('userLog');
        this.applyFilters(avgResponseTimeQuery, filter);
        const avgResponseTimeResult = await avgResponseTimeQuery
            .select('AVG(userLog.responseTime)', 'avgResponseTime')
            .where('userLog.responseTime IS NOT NULL')
            .getRawOne();

        const averageResponseTime = parseFloat(avgResponseTimeResult?.avgResponseTime || '0');

        return {
            totalLogs,
            logsByLevel,
            logsByActionType,
            topUsers: topUsers.map(item => ({
                userId: item.userId,
                count: parseInt(item.count),
            })),
            topIpAddresses: topIpAddresses.map(item => ({
                ipAddress: item.ipAddress,
                count: parseInt(item.count),
            })),
            errorRate,
            averageResponseTime,
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
        return this.findMany(
            { ...filter, actionType: UserActionType.SECURITY_EVENT },
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
            order: {
                createdAt: 'ASC',
            },
        });
    }

    async deleteOldLogs(olderThanDays: number): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const result = await this.repository.delete({
            createdAt: LessThan(cutoffDate),
        });

        return result.affected || 0;
    }

    async getLogStatistics(
        period: 'hour' | 'day' | 'week' | 'month',
        startDate: Date,
        endDate: Date,
    ): Promise<Array<{ date: string; count: number; level: LogLevel }>> {
        let dateFormat: string;
        switch (period) {
            case 'hour':
                dateFormat = 'YYYY-MM-DD HH24:00:00';
                break;
            case 'day':
                dateFormat = 'YYYY-MM-DD';
                break;
            case 'week':
                dateFormat = 'YYYY-"W"WW';
                break;
            case 'month':
                dateFormat = 'YYYY-MM';
                break;
        }

        const queryBuilder = this.repository.createQueryBuilder('userLog');
        const results = await queryBuilder
            .select(`TO_CHAR(userLog.createdAt, '${dateFormat}')`, 'date')
            .addSelect('userLog.level', 'level')
            .addSelect('COUNT(*)', 'count')
            .where('userLog.createdAt BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            })
            .groupBy('date, userLog.level')
            .orderBy('date', 'ASC')
            .getRawMany();

        return results.map(result => ({
            date: result.date,
            count: parseInt(result.count),
            level: result.level as LogLevel,
        }));
    }

    private applyFilters(queryBuilder: any, filter: UserLogFilter): void {
        if (filter.userId) {
            queryBuilder.andWhere('userLog.userId = :userId', { userId: filter.userId });
        }

        if (filter.actionType) {
            queryBuilder.andWhere('userLog.actionType = :actionType', {
                actionType: filter.actionType,
            });
        }

        if (filter.level) {
            queryBuilder.andWhere('userLog.level = :level', { level: filter.level });
        }

        if (filter.resourceType) {
            queryBuilder.andWhere('userLog.resourceType = :resourceType', {
                resourceType: filter.resourceType,
            });
        }

        if (filter.ipAddress) {
            queryBuilder.andWhere('userLog.ipAddress = :ipAddress', {
                ipAddress: filter.ipAddress,
            });
        }

        if (filter.startDate) {
            queryBuilder.andWhere('userLog.createdAt >= :startDate', {
                startDate: filter.startDate,
            });
        }

        if (filter.endDate) {
            queryBuilder.andWhere('userLog.createdAt <= :endDate', {
                endDate: filter.endDate,
            });
        }

        if (filter.search) {
            queryBuilder.andWhere(
                '(userLog.description ILIKE :search OR userLog.errorMessage ILIKE :search)',
                { search: `%${filter.search}%` },
            );
        }
    }
}
