import {
    Controller,
    DefaultValuePipe,
    Get,
    Inject,
    ParseIntPipe,
    Query,
    UseGuards
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiOperation,
    ApiQuery,
    ApiTags,
    ApiUnauthorizedResponse
} from '@nestjs/swagger';
import {
    PaginatedUserLogResult,
    UserLogFilter,
    UserLogPaginationOptions,
    UserLogRepositoryPort,
    UserLogSummary,
} from '../../application/ports/output/user-log-repository.port';
import { LogLevel, UserActionType } from '../../domain/entities/user-log.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('user-logs')
@Controller({ path: 'user-logs', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UserLogController {
    constructor(
        @Inject('UserLogRepositoryPort')
        private readonly userLogRepository: UserLogRepositoryPort,
    ) { }

    @Get()
    @ApiOperation({
        summary: '사용자 로그 목록 조회',
        description: '필터링과 페이지네이션을 지원하는 사용자 로그 목록을 조회합니다.',
    })
    @ApiQuery({
        name: 'page',
        type: 'integer',
        example: 1,
        required: false,
    })
    @ApiQuery({
        name: 'limit',
        type: 'integer',
        example: 20,
        required: false,
    })
    @ApiQuery({
        name: 'userId',
        type: 'string',
        required: false,
    })
    @ApiQuery({
        name: 'actionType',
        enum: UserActionType,
        required: false,
    })
    @ApiQuery({
        name: 'level',
        enum: LogLevel,
        required: false,
    })
    @ApiQuery({
        name: 'resourceType',
        type: 'string',
        required: false,
    })
    @ApiQuery({
        name: 'ipAddress',
        type: 'string',
        required: false,
    })
    @ApiQuery({
        name: 'startDate',
        type: 'string',
        required: false,
    })
    @ApiQuery({
        name: 'endDate',
        type: 'string',
        required: false,
    })
    @ApiQuery({
        name: 'search',
        type: 'string',
        required: false,
    })
    @ApiOkResponse({
        description: '사용자 로그 목록 조회 성공',
        schema: {
            type: 'object',
            properties: {
                data: { type: 'array', items: { $ref: '#/components/schemas/UserLog' } },
                total: { type: 'integer', example: 100 },
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 20 },
                totalPages: { type: 'integer', example: 5 },
            },
        },
    })
    @ApiUnauthorizedResponse({ description: '인증 실패' })
    @ApiForbiddenResponse({ description: '접근 권한 없음' })
    @ApiBadRequestResponse({ description: '잘못된 요청 파라미터' })
    @ApiInternalServerErrorResponse({ description: '서버 내부 오류' })
    async getUserLogs(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('userId') userId?: string,
        @Query('actionType') actionType?: UserActionType,
        @Query('level') level?: LogLevel,
        @Query('resourceType') resourceType?: string,
        @Query('ipAddress') ipAddress?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('search') search?: string,
    ): Promise<PaginatedUserLogResult> {
        const filter: UserLogFilter = {
            userId,
            actionType,
            level,
            resourceType,
            ipAddress,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            search,
        };

        const options: UserLogPaginationOptions = {
            page,
            limit,
            sortBy: 'createdAt',
            sortOrder: 'DESC',
        };

        return this.userLogRepository.findMany(filter, options);
    }

    @Get('summary')
    @ApiOperation({
        summary: '사용자 로그 요약 정보 조회',
        description: '지정된 기간의 사용자 로그 요약 통계를 조회합니다.',
    })
    @ApiQuery({
        name: 'period',
        enum: ['day', 'week', 'month'],
        required: false,
    })
    @ApiQuery({
        name: 'userId',
        type: 'string',
        required: false,
    })
    @ApiOkResponse({
        description: '사용자 로그 요약 조회 성공',
        schema: {
            type: 'object',
            properties: {
                totalLogs: { type: 'integer', example: 1000 },
                logsByLevel: {
                    type: 'object',
                    properties: {
                        INFO: { type: 'integer', example: 800 },
                        WARN: { type: 'integer', example: 150 },
                        ERROR: { type: 'integer', example: 50 },
                        DEBUG: { type: 'integer', example: 0 },
                    },
                },
                logsByActionType: {
                    type: 'object',
                    example: { LOGIN: 100, API_ACCESS: 800, ERROR_OCCURRED: 50 },
                },
                topUsers: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            userId: { type: 'string', example: 'user-123' },
                            count: { type: 'integer', example: 50 },
                        },
                    },
                },
                topIpAddresses: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            ipAddress: { type: 'string', example: '192.168.1.100' },
                            count: { type: 'integer', example: 25 },
                        },
                    },
                },
                errorRate: { type: 'number', example: 5.0 },
                averageResponseTime: { type: 'number', example: 250.5 },
            },
        },
    })
    async getUserLogSummary(
        @Query('period', new DefaultValuePipe('week')) period: 'day' | 'week' | 'month',
        @Query('userId') userId?: string,
    ): Promise<UserLogSummary> {
        const filter: UserLogFilter = { userId };
        return this.userLogRepository.getSummary(filter, period);
    }

    @Get('errors')
    @ApiOperation({
        summary: '에러 로그 조회',
        description: '에러 레벨의 로그만 필터링하여 조회합니다.',
    })
    @ApiQuery({
        name: 'page',
        type: 'integer',
        example: 1,
        required: false,
    })
    @ApiQuery({
        name: 'limit',
        type: 'integer',
        example: 20,
        required: false,
    })
    @ApiQuery({
        name: 'userId',
        type: 'string',
        required: false,
    })
    @ApiQuery({
        name: 'startDate',
        type: 'string',
        required: false,
    })
    @ApiQuery({
        name: 'endDate',
        type: 'string',
        required: false,
    })
    @ApiOkResponse({
        description: '에러 로그 조회 성공',
        schema: {
            type: 'object',
            properties: {
                data: { type: 'array', items: { $ref: '#/components/schemas/UserLog' } },
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                totalPages: { type: 'integer' },
            },
        },
    })
    async getErrorLogs(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('userId') userId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ): Promise<PaginatedUserLogResult> {
        const filter: UserLogFilter = {
            userId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        };

        const options: UserLogPaginationOptions = {
            page,
            limit,
            sortBy: 'createdAt',
            sortOrder: 'DESC',
        };

        return this.userLogRepository.getErrorLogs(filter, options);
    }

    @Get('security')
    @ApiOperation({
        summary: '보안 로그 조회',
        description: '보안 관련 로그(로그인, 로그아웃, 보안 이벤트)를 조회합니다.',
    })
    @ApiQuery({
        name: 'page',
        type: 'integer',
        example: 1,
        required: false,
    })
    @ApiQuery({
        name: 'limit',
        type: 'integer',
        example: 20,
        required: false,
    })
    @ApiQuery({
        name: 'userId',
        type: 'string',
        required: false,
    })
    @ApiQuery({
        name: 'startDate',
        type: 'string',
        required: false,
    })
    @ApiQuery({
        name: 'endDate',
        type: 'string',
        required: false,
    })
    @ApiOkResponse({
        description: '보안 로그 조회 성공',
        schema: {
            type: 'object',
            properties: {
                data: { type: 'array', items: { $ref: '#/components/schemas/UserLog' } },
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                totalPages: { type: 'integer' },
            },
        },
    })
    async getSecurityLogs(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('userId') userId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ): Promise<PaginatedUserLogResult> {
        const filter: UserLogFilter = {
            userId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        };

        const options: UserLogPaginationOptions = {
            page,
            limit,
            sortBy: 'createdAt',
            sortOrder: 'DESC',
        };

        return this.userLogRepository.getSecurityLogs(filter, options);
    }

    @Get('statistics')
    @ApiOperation({
        summary: '로그 통계 조회',
        description: '시간대별 로그 통계를 조회합니다.',
    })
    @ApiQuery({
        name: 'period',
        enum: ['hour', 'day', 'week', 'month'],
        required: false,
    })
    @ApiQuery({
        name: 'startDate',
        type: 'string',
        required: true,
    })
    @ApiQuery({
        name: 'endDate',
        type: 'string',
        required: true,
    })
    @ApiOkResponse({
        description: '로그 통계 조회 성공',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    date: { type: 'string', format: 'date-time' },
                    count: { type: 'integer', example: 100 },
                    level: { type: 'string', enum: ['INFO', 'WARN', 'ERROR', 'DEBUG'] },
                },
            },
        },
    })
    async getLogStatistics(
        @Query('period', new DefaultValuePipe('day'))
        period: 'hour' | 'day' | 'week' | 'month',
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        return this.userLogRepository.getLogStatistics(
            period,
            new Date(startDate),
            new Date(endDate),
        );
    }

    @Get(':userId/timeline')
    @ApiOperation({
        summary: '사용자 활동 타임라인 조회',
        description: '특정 사용자의 시간대별 활동 타임라인을 조회합니다.',
    })
    @ApiQuery({
        name: 'startDate',
        type: 'string',
        required: true,
    })
    @ApiQuery({
        name: 'endDate',
        type: 'string',
        required: true,
    })
    @ApiOkResponse({
        description: '사용자 활동 타임라인 조회 성공',
        type: 'array',
        schema: {
            type: 'array',
            items: { $ref: '#/components/schemas/UserLog' },
        },
    })
    async getUserActivityTimeline(
        @Query('userId') userId: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        return this.userLogRepository.getUserActivityTimeline(
            userId,
            new Date(startDate),
            new Date(endDate),
        );
    }
}
