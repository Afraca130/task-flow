import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { ActivityLogRepository } from './activity-log.repository';
import { ActivityLogService } from './activity-log.service';
import { ActivityLog } from './entities/activity-log.entity';

@ApiTags('activity-logs')
@Controller({ path: 'activity-logs', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ActivityLogsController {
    constructor(
        private readonly activityLogService: ActivityLogService,
        private readonly activityLogRepository: ActivityLogRepository,
    ) { }

    @Get('project/:projectId')
    @ApiOperation({
        summary: 'Get project activity logs',
        description: 'Retrieves activity logs for a specific project',
    })
    @ApiParam({
        name: 'projectId',
        description: 'Project ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiQuery({
        name: 'limit',
        description: 'Number of logs to retrieve',
        type: 'integer',
        required: false,
        example: 50,
    })
    @ApiQuery({
        name: 'offset',
        description: 'Number of logs to skip',
        type: 'integer',
        required: false,
        example: 0,
    })
    @ApiResponse({
        status: 200,
        description: 'Activity logs retrieved successfully',
        type: [ActivityLog],
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Project not found' })
    async getProjectActivityLogs(
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Query('limit') limit: number = 50,
        @Query('offset') offset: number = 0,
        @Request() req: any,
    ): Promise<ActivityLog[]> {
        return await this.activityLogRepository.getActivityLogs({
            projectId,
            limit: Math.min(limit, 100), // Cap at 100
            offset,
        });
    }

    @Get('user/:userId')
    @ApiOperation({
        summary: 'Get user activity logs',
        description: 'Retrieves activity logs for a specific user',
    })
    @ApiParam({
        name: 'userId',
        description: 'User ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiQuery({
        name: 'limit',
        description: 'Number of logs to retrieve',
        type: 'integer',
        required: false,
        example: 50,
    })
    @ApiQuery({
        name: 'offset',
        description: 'Number of logs to skip',
        type: 'integer',
        required: false,
        example: 0,
    })
    @ApiResponse({
        status: 200,
        description: 'Activity logs retrieved successfully',
        type: [ActivityLog],
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getUserActivityLogs(
        @Param('userId', ParseUUIDPipe) userId: string,
        @Query('limit') limit: number = 50,
        @Query('offset') offset: number = 0,
        @Request() req: any,
    ): Promise<ActivityLog[]> {
        return await this.activityLogRepository.getActivityLogs({
            userId,
            limit: Math.min(limit, 100), // Cap at 100
            offset,
        });
    }

    @Get()
    @ApiOperation({
        summary: 'Get activity logs',
        description: 'Retrieves activity logs with optional filtering',
    })
    @ApiQuery({
        name: 'limit',
        description: 'Number of logs to retrieve',
        type: 'integer',
        required: false,
        example: 20,
    })
    @ApiQuery({
        name: 'projectId',
        description: 'Filter by project ID',
        type: 'string',
        required: false,
    })
    @ApiResponse({
        status: 200,
        description: 'Activity logs retrieved successfully',
        type: [ActivityLog],
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getActivityLogs(
        @Request() req: any,
        @Query('limit') limit: number = 20,
        @Query('projectId') projectId?: string,
    ): Promise<ActivityLog[]> {
        const filters: any = {
            limit: Math.min(limit, 50), // Cap at 50 for recent logs
            offset: 0,
        };

        if (projectId) {
            filters.projectId = projectId;
        }

        return await this.activityLogRepository.getActivityLogs(filters);
    }

    @Get('recent')
    @ApiOperation({
        summary: 'Get recent activity logs',
        description: 'Retrieves recent activity logs for the authenticated user',
    })
    @ApiQuery({
        name: 'limit',
        description: 'Number of logs to retrieve',
        type: 'integer',
        required: false,
        example: 20,
    })
    @ApiQuery({
        name: 'projectId',
        description: 'Filter by project ID',
        type: 'string',
        required: false,
    })
    @ApiResponse({
        status: 200,
        description: 'Recent activity logs retrieved successfully',
        type: [ActivityLog],
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getRecentActivityLogs(
        @Request() req: any,
        @Query('limit') limit: number = 20,
        @Query('projectId') projectId?: string,
    ): Promise<ActivityLog[]> {
        const filters: any = {
            limit: Math.min(limit, 50), // Cap at 50 for recent logs
            offset: 0,
        };

        if (projectId) {
            filters.projectId = projectId;
        }

        return await this.activityLogRepository.getActivityLogs(filters);
    }

    @Get('search')
    @ApiOperation({
        summary: 'Search activity logs',
        description: 'Search activity logs by description or action',
    })
    @ApiQuery({
        name: 'q',
        description: 'Search query',
        type: 'string',
        required: true,
    })
    @ApiQuery({
        name: 'projectId',
        description: 'Filter by project ID',
        type: 'string',
        required: false,
    })
    @ApiQuery({
        name: 'userId',
        description: 'Filter by user ID',
        type: 'string',
        required: false,
    })
    @ApiQuery({
        name: 'limit',
        description: 'Number of logs to retrieve',
        type: 'integer',
        required: false,
        example: 20,
    })
    @ApiResponse({
        status: 200,
        description: 'Search results retrieved successfully',
        type: [ActivityLog],
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async searchActivityLogs(
        @Query('q') query: string,
        @Request() req: any,
        @Query('projectId') projectId?: string,
        @Query('userId') userId?: string,
        @Query('limit') limit: number = 20,
    ): Promise<ActivityLog[]> {
        return await this.activityLogRepository.searchActivityLogs(query, {
            projectId,
            userId,
            limit: Math.min(limit, 50),
        });
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get activity log by ID',
        description: 'Retrieves a specific activity log by its ID',
    })
    @ApiParam({
        name: 'id',
        description: 'Activity log ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: 200,
        description: 'Activity log found and returned',
        type: ActivityLog,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Activity log not found' })
    async getActivityLogById(
        @Param('id', ParseUUIDPipe) id: string,
        @Request() req: any,
    ): Promise<ActivityLog | null> {
        return await this.activityLogRepository.findById(id);
    }
}
