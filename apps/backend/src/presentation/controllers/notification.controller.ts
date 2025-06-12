import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Req,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

interface NotificationSummary {
    unreadCount: number;
    totalCount: number;
    lastNotificationAt?: string;
}

interface NotificationResponse {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    readAt?: string;
}

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationController {
    constructor(
        // TODO: Inject notification use cases when implemented
    ) { }

    @Get('unread-count')
    @ApiOperation({
        summary: '읽지 않은 알림 개수 조회',
        description: '현재 사용자의 읽지 않은 알림 개수를 반환합니다.',
    })
    @ApiOkResponse({
        description: '읽지 않은 알림 개수 조회 성공',
        schema: {
            type: 'object',
            properties: {
                unreadCount: {
                    type: 'integer',
                    example: 5,
                    description: '읽지 않은 알림 개수'
                },
                totalCount: {
                    type: 'integer',
                    example: 25,
                    description: '전체 알림 개수'
                },
                lastNotificationAt: {
                    type: 'string',
                    format: 'date-time',
                    example: '2023-12-01T10:00:00Z',
                    description: '마지막 알림 시간'
                }
            }
        }
    })
    @ApiUnauthorizedResponse({
        description: '인증이 필요합니다',
    })
    async getUnreadCount(@Req() req: Request): Promise<NotificationSummary> {
        const userId = (req as any).user?.id;

        // TODO: Implement actual notification logic
        // const summary = await this.getNotificationSummaryUseCase.execute(userId);
        // return summary;

        // Temporary mock response
        return {
            unreadCount: 0,
            totalCount: 0,
            lastNotificationAt: undefined,
        };
    }

    @Get()
    @ApiOperation({
        summary: '알림 목록 조회',
        description: '현재 사용자의 알림 목록을 조회합니다.',
    })
    @ApiOkResponse({
        description: '알림 목록 조회 성공',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'uuid' },
                    title: { type: 'string', example: '새로운 태스크가 할당되었습니다' },
                    message: { type: 'string', example: '프로젝트 A에서 새로운 태스크가 할당되었습니다.' },
                    type: { type: 'string', example: 'TASK_ASSIGNED' },
                    isRead: { type: 'boolean', example: false },
                    createdAt: { type: 'string', format: 'date-time' },
                    readAt: { type: 'string', format: 'date-time', nullable: true }
                }
            }
        }
    })
    async getNotifications(@Req() req: Request): Promise<NotificationResponse[]> {
        const userId = (req as any).user?.id;

        // TODO: Implement actual notification logic
        // const notifications = await this.getNotificationsUseCase.execute(userId);
        // return notifications;

        // Temporary mock response
        return [];
    }

    @Patch(':id/read')
    @ApiOperation({
        summary: '알림 읽음 처리',
        description: '특정 알림을 읽음으로 표시합니다.',
    })
    @ApiOkResponse({
        description: '알림 읽음 처리 성공',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: '알림이 읽음으로 처리되었습니다' }
            }
        }
    })
    @ApiNotFoundResponse({
        description: '알림을 찾을 수 없습니다',
    })
    async markAsRead(
        @Param('id', ParseUUIDPipe) notificationId: string,
        @Req() req: Request,
    ): Promise<{ message: string }> {
        const userId = (req as any).user?.id;

        // TODO: Implement actual notification logic
        // await this.markNotificationAsReadUseCase.execute(notificationId, userId);

        return { message: '알림이 읽음으로 처리되었습니다' };
    }

    @Patch('read-all')
    @ApiOperation({
        summary: '모든 알림 읽음 처리',
        description: '현재 사용자의 모든 알림을 읽음으로 표시합니다.',
    })
    @ApiOkResponse({
        description: '모든 알림 읽음 처리 성공',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: '모든 알림이 읽음으로 처리되었습니다' },
                count: { type: 'integer', example: 5 }
            }
        }
    })
    async markAllAsRead(@Req() req: Request): Promise<{ message: string; count: number }> {
        const userId = (req as any).user?.id;

        // TODO: Implement actual notification logic
        // const count = await this.markAllNotificationsAsReadUseCase.execute(userId);

        return {
            message: '모든 알림이 읽음으로 처리되었습니다',
            count: 0
        };
    }
}
