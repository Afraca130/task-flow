import { Injectable, Logger } from '@nestjs/common';
import { CreateNotificationDto } from './dto/request/create-notification.dto';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationsRepository } from './notifications.repository';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        private readonly notificationsRepository: NotificationsRepository,
    ) { }

    /**
     * Create notification
     */
    async createNotification(createDto: CreateNotificationDto): Promise<Notification> {
        this.logger.log(`Creating notification for user: ${createDto.userId}`);

        try {
            const notification = Notification.create(
                createDto.userId,
                createDto.type,
                createDto.title,
                createDto.message,
                createDto.data,
                createDto.relatedEntityType,
                createDto.relatedEntityId
            );

            const savedNotification = await this.notificationsRepository.save(notification);
            this.logger.log(`Notification created successfully: ${savedNotification.id}`);

            return savedNotification;
        } catch (error) {
            this.logger.error(`Failed to create notification for user: ${createDto.userId}`, error);
            throw error;
        }
    }

    /**
     * Get user notifications
     */
    async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
        return await this.notificationsRepository.findByUserId(userId, unreadOnly);
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string, userId: string): Promise<Notification> {
        this.logger.log(`Marking notification as read: ${notificationId}`);

        const notification = await this.notificationsRepository.findById(notificationId);
        if (!notification) {
            throw new Error('Notification not found');
        }

        if (notification.userId !== userId) {
            throw new Error('Unauthorized to mark this notification as read');
        }

        notification.markAsRead();
        return await this.notificationsRepository.save(notification);
    }

    /**
     * Mark all notifications as read for user
     */
    async markAllAsRead(userId: string): Promise<void> {
        this.logger.log(`Marking all notifications as read for user: ${userId}`);
        await this.notificationsRepository.markAllAsReadForUser(userId);
    }

    /**
     * Delete notification
     */
    async deleteNotification(notificationId: string, userId: string): Promise<void> {
        this.logger.log(`Deleting notification: ${notificationId}`);

        const notification = await this.notificationsRepository.findById(notificationId);
        if (!notification) {
            throw new Error('Notification not found');
        }

        if (notification.userId !== userId) {
            throw new Error('Unauthorized to delete this notification');
        }

        await this.notificationsRepository.delete(notificationId);
    }

    /**
     * Get unread count for user
     */
    async getUnreadCount(userId: string): Promise<number> {
        return await this.notificationsRepository.getUnreadCountForUser(userId);
    }

    /**
     * Create project invitation notification
     */
    async createProjectInvitationNotification(
        inviteeId: string,
        inviterName: string,
        projectName: string,
        invitationId: string
    ): Promise<Notification> {
        return await this.createNotification({
            userId: inviteeId,
            type: NotificationType.PROJECT_INVITATION,
            title: '프로젝트 초대',
            message: `${inviterName}님이 "${projectName}" 프로젝트에 초대했습니다.`,
            data: {
                inviterName,
                projectName,
                invitationId,
            },
            relatedEntityType: 'invitation',
            relatedEntityId: invitationId,
        });
    }

    /**
     * Create task assignment notification
     */
    async createTaskAssignmentNotification(
        assigneeId: string,
        assignerName: string,
        taskTitle: string,
        taskId: string
    ): Promise<Notification> {
        return await this.createNotification({
            userId: assigneeId,
            type: NotificationType.TASK_ASSIGNED,
            title: '업무 할당',
            message: `${assignerName}님이 "${taskTitle}" 업무를 할당했습니다.`,
            data: {
                assignerName,
                taskTitle,
                taskId,
            },
            relatedEntityType: 'task',
            relatedEntityId: taskId,
        });
    }

    /**
     * Create comment mention notification
     */
    async createCommentMentionNotification(
        mentionedUserId: string,
        commenterName: string,
        commentContent: string,
        taskTitle: string,
        commentId: string
    ): Promise<Notification> {
        return await this.createNotification({
            userId: mentionedUserId,
            type: NotificationType.COMMENT_MENTION,
            title: '댓글 멘션',
            message: `${commenterName}님이 "${taskTitle}" 업무에서 회원님을 언급했습니다.`,
            data: {
                commenterName,
                commentContent,
                taskTitle,
                commentId,
            },
            relatedEntityType: 'comment',
            relatedEntityId: commentId,
        });
    }

    /**
     * Create issue assignment notification
     */
    async createIssueAssignmentNotification(
        assigneeId: string,
        assignerName: string,
        issueTitle: string,
        issueId: string
    ): Promise<Notification> {
        return await this.createNotification({
            userId: assigneeId,
            type: NotificationType.ISSUE_ASSIGNED,
            title: '이슈 할당',
            message: `${assignerName}님이 "${issueTitle}" 이슈를 할당했습니다.`,
            data: {
                assignerName,
                issueTitle,
                issueId,
            },
            relatedEntityType: 'issue',
            relatedEntityId: issueId,
        });
    }
}
