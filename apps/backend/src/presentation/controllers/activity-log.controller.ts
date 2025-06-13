import {
    Controller,
    DefaultValuePipe,
    Get,
    Inject,
    ParseIntPipe,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiOperation,
    ApiQuery,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ActivityLogRepositoryPort } from '../../application/ports/output/activity-log-repository.port';
import { ActivityLog } from '../../domain/entities/activity-log.entity';
import { ErrorResponseDto } from '../dto/response/error-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('activity-logs')
@Controller('activity-logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ActivityLogController {
    constructor(
        @Inject('ActivityLogRepositoryPort')
        private readonly activityLogRepository: ActivityLogRepositoryPort,
    ) { }

    @Get()
    @ApiOperation({
        summary: 'Get activity logs',
        description: 'Retrieves activity logs with optional filtering by project',
    })
    @ApiQuery({
        name: 'projectId',
        description: 'Filter by project ID',
        required: false,
        type: 'string',
    })
    @ApiQuery({
        name: 'page',
        description: 'Page number (1-based)',
        required: false,
        type: 'integer',
        example: 1,
    })
    @ApiQuery({
        name: 'limit',
        description: 'Number of items per page',
        required: false,
        type: 'integer',
        example: 20,
    })
    @ApiQuery({
        name: 'entityType',
        description: 'Filter by entity type',
        required: false,
        type: 'string',
        enum: ['TASK', 'PROJECT', 'USER', 'COMMENT', 'PROJECT_MEMBER'],
    })
    @ApiOkResponse({
        description: 'Activity logs retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                status: { type: 'integer', example: 200 },
                message: { type: 'string', example: 'Activity logs retrieved successfully' },
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            userId: { type: 'string', format: 'uuid' },
                            projectId: { type: 'string', format: 'uuid' },
                            entityId: { type: 'string', format: 'uuid' },
                            entityType: { type: 'string', enum: ['TASK', 'PROJECT', 'USER', 'COMMENT', 'PROJECT_MEMBER'] },
                            action: { type: 'string' },
                            description: { type: 'string' },
                            metadata: { type: 'object' },
                            timestamp: { type: 'string', format: 'date-time' },
                            user: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    name: { type: 'string' },
                                    email: { type: 'string' },
                                },
                            },
                            project: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    name: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                timestamp: { type: 'string', format: 'date-time' },
            },
        },
    })
    @ApiUnauthorizedResponse({
        description: 'Authentication required',
        type: ErrorResponseDto,
    })
    @ApiBadRequestResponse({
        description: 'Invalid query parameters',
        type: ErrorResponseDto,
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error',
        type: ErrorResponseDto,
    })
    async getActivityLogs(
        @Query('projectId') projectId?: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
        @Query('entityType') entityType?: string,
    ): Promise<{ data: ActivityLog[]; meta: any }> {
        const result = await this.activityLogRepository.findMany({
            projectId,
            entityType,
            page,
            limit,
        });

        return {
            data: result.data,
            meta: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
            },
        };
    }

    @Get('recent')
    @ApiOperation({
        summary: 'Get recent activity logs',
        description: 'Retrieves the most recent activity logs',
    })
    @ApiQuery({
        name: 'projectId',
        description: 'Filter by project ID',
        required: false,
        type: 'string',
    })
    @ApiQuery({
        name: 'limit',
        description: 'Number of recent logs to retrieve',
        required: false,
        type: 'integer',
        example: 10,
    })
    @ApiOkResponse({
        description: 'Recent activity logs retrieved successfully',
    })
    async getRecentActivityLogs(
        @Query('projectId') projectId?: string,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    ): Promise<ActivityLog[]> {
        const result = await this.activityLogRepository.findMany({
            projectId,
            page: 1,
            limit,
        });

        return result.data;
    }
}
