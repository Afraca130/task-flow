import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Put,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateNotificationDto } from './dto/request/create-notification.dto';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller({ path: 'notifications', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,
    ) { }

    @Post()
    @ApiOperation({
        summary: 'Create a new notification',
        description: 'Creates a new notification for a user',
    })
    @ApiBody({ type: CreateNotificationDto })
    @ApiResponse({
        status: 201,
        description: 'Notification created successfully',
        type: Notification,
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async createNotification(@Body() createDto: CreateNotificationDto): Promise<Notification> {
        return await this.notificationsService.createNotification(createDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Get user notifications',
        description: 'Retrieves notifications for the authenticated user',
    })
    @ApiQuery({
        name: 'unreadOnly',
        description: 'Get only unread notifications',
        type: 'boolean',
        required: false,
    })
    @ApiResponse({
        status: 200,
        description: 'Notifications retrieved successfully',
        type: [Notification],
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getUserNotifications(
        @Request() req: any,
        @Query('unreadOnly') unreadOnly?: boolean,
    ): Promise<Notification[]> {
        return await this.notificationsService.getUserNotifications(
            req.user.id,
            unreadOnly === true
        );
    }

    @Put(':id/read')
    @ApiOperation({
        summary: 'Mark notification as read',
        description: 'Marks a specific notification as read',
    })
    @ApiParam({
        name: 'id',
        description: 'Notification ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: 200,
        description: 'Notification marked as read',
        type: Notification,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Notification not found' })
    async markAsRead(
        @Param('id', ParseUUIDPipe) id: string,
        @Request() req: any,
    ): Promise<Notification> {
        return await this.notificationsService.markAsRead(id, req.user.id);
    }

    @Put('mark-all-read')
    @ApiOperation({
        summary: 'Mark all notifications as read',
        description: 'Marks all notifications as read for the authenticated user',
    })
    @ApiResponse({
        status: 200,
        description: 'All notifications marked as read',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async markAllAsRead(@Request() req: any): Promise<{ message: string }> {
        await this.notificationsService.markAllAsRead(req.user.id);
        return { message: 'All notifications marked as read' };
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Delete a notification',
        description: 'Deletes a specific notification',
    })
    @ApiParam({
        name: 'id',
        description: 'Notification ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: 200,
        description: 'Notification deleted successfully',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Notification not found' })
    async deleteNotification(
        @Param('id', ParseUUIDPipe) id: string,
        @Request() req: any,
    ): Promise<{ message: string }> {
        await this.notificationsService.deleteNotification(id, req.user.id);
        return { message: 'Notification deleted successfully' };
    }

    @Get('unread-count')
    @ApiOperation({
        summary: 'Get unread notifications count',
        description: 'Retrieves the count of unread notifications for the authenticated user',
    })
    @ApiResponse({
        status: 200,
        description: 'Unread count retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                unreadCount: { type: 'integer', example: 5 },
                totalCount: { type: 'integer', example: 10 }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getUnreadCount(@Request() req: any): Promise<{ unreadCount: number; totalCount: number }> {
        const unreadCount = await this.notificationsService.getUnreadCount(req.user.id);
        const totalCount = await this.notificationsService.getTotalCount(req.user.id);
        return { unreadCount, totalCount };
    }


}
