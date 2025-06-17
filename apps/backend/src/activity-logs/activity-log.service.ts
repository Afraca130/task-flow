import { Injectable, Logger } from '@nestjs/common';
import { ActivityLogRepository } from './activity-log.repository';
import { ActivityAction, EntityType } from './entities/activity-log.entity';
import { CreateActivityLogRequest } from './interfaces/activity-log.interface';

@Injectable()
export class ActivityLogService {
    private readonly logger = new Logger(ActivityLogService.name);

    constructor(
        private readonly activityLogRepository: ActivityLogRepository,
    ) { }

    async logTaskCreated(
        userId: string,
        projectId: string,
        taskId: string,
        taskTitle: string,
    ): Promise<void> {
        try {
            const request: CreateActivityLogRequest = {
                userId,
                projectId,
                entityId: taskId,
                entityType: EntityType.TASK,
                action: ActivityAction.CREATE,
                description: `새 업무 "${taskTitle}"를 생성했습니다.`,
                resourceType: 'task',
                metadata: { taskTitle },
            };

            await this.activityLogRepository.create(request);
            this.logger.log(`Activity log created for task creation: ${taskId}`);
        } catch (error) {
            this.logger.error(`Failed to log task creation: ${taskId}`, error);
        }
    }

    async logTaskUpdated(
        userId: string,
        projectId: string,
        taskId: string,
        taskTitle: string,
        changes: Record<string, any>,
    ): Promise<void> {
        try {
            const request: CreateActivityLogRequest = {
                userId,
                projectId,
                entityId: taskId,
                entityType: EntityType.TASK,
                action: ActivityAction.UPDATE,
                description: `업무 "${taskTitle}"를 수정했습니다.`,
                resourceType: 'task',
                metadata: { taskTitle, changes },
            };

            await this.activityLogRepository.create(request);
            this.logger.log(`Activity log created for task update: ${taskId}`);
        } catch (error) {
            this.logger.error(`Failed to log task update: ${taskId}`, error);
        }
    }

    async logTaskStatusChanged(
        userId: string,
        projectId: string,
        taskId: string,
        taskTitle: string,
        oldStatus: string,
        newStatus: string,
    ): Promise<void> {
        try {
            const request: CreateActivityLogRequest = {
                userId,
                projectId,
                entityId: taskId,
                entityType: EntityType.TASK,
                action: ActivityAction.STATUS_CHANGE,
                description: `"${taskTitle}" 업무 상태를 ${oldStatus}에서 ${newStatus}로 변경했습니다.`,
                resourceType: 'task',
                metadata: { taskTitle, oldStatus, newStatus },
            };

            await this.activityLogRepository.create(request);
            this.logger.log(`Activity log created for task status change: ${taskId}`);
        } catch (error) {
            this.logger.error(`Failed to log task status change: ${taskId}`, error);
        }
    }

    async logTaskAssigned(
        userId: string,
        projectId: string,
        taskId: string,
        taskTitle: string,
        assigneeId: string,
        assigneeName: string,
    ): Promise<void> {
        try {
            const request: CreateActivityLogRequest = {
                userId,
                projectId,
                entityId: taskId,
                entityType: EntityType.TASK,
                action: ActivityAction.ASSIGN,
                description: `"${taskTitle}" 업무를 ${assigneeName}에게 할당했습니다.`,
                resourceType: 'task',
                metadata: { taskTitle, assigneeId, assigneeName },
            };

            await this.activityLogRepository.create(request);
            this.logger.log(`Activity log created for task assignment: ${taskId}`);
        } catch (error) {
            this.logger.error('Failed to log task assignment', error);
        }
    }

    async logTaskDeleted(
        userId: string,
        projectId: string,
        taskId: string,
        taskTitle: string,
    ): Promise<void> {
        try {
            const request: CreateActivityLogRequest = {
                userId,
                projectId,
                entityId: taskId,
                entityType: EntityType.TASK,
                action: ActivityAction.DELETE,
                description: `업무 "${taskTitle}"를 삭제했습니다.`,
                resourceType: 'task',
                metadata: { taskTitle },
            };

            await this.activityLogRepository.create(request);
        } catch (error) {
            this.logger.error('Failed to log task deletion', error);
        }
    }

    async logProjectCreated(
        userId: string,
        projectId: string,
        projectName: string,
    ): Promise<void> {
        try {
            const request: CreateActivityLogRequest = {
                userId,
                projectId,
                entityId: projectId,
                entityType: EntityType.PROJECT,
                action: ActivityAction.CREATE,
                description: `새 프로젝트 "${projectName}"를 생성했습니다.`,
                resourceType: 'project',
                metadata: { projectName },
            };

            await this.activityLogRepository.create(request);
        } catch (error) {
            this.logger.error('Failed to log project creation', error);
        }
    }

    async logProjectUpdated(
        userId: string,
        projectId: string,
        projectName: string,
        changes: Record<string, any>,
    ): Promise<void> {
        try {
            const request: CreateActivityLogRequest = {
                userId,
                projectId,
                entityId: projectId,
                entityType: EntityType.PROJECT,
                action: ActivityAction.UPDATE,
                description: `프로젝트 "${projectName}"를 수정했습니다.`,
                resourceType: 'project',
                metadata: { projectName, changes },
            };

            await this.activityLogRepository.create(request);
        } catch (error) {
            this.logger.error('Failed to log project update', error);
        }
    }

    async logCommentCreated(
        userId: string,
        projectId: string,
        commentId: string,
        taskTitle: string,
    ): Promise<void> {
        try {
            const request: CreateActivityLogRequest = {
                userId,
                projectId,
                entityId: commentId,
                entityType: EntityType.COMMENT,
                action: ActivityAction.COMMENT,
                description: `"${taskTitle}" 업무에 댓글을 작성했습니다.`,
                resourceType: 'comment',
                metadata: { taskTitle },
            };

            await this.activityLogRepository.create(request);
        } catch (error) {
            this.logger.error('Failed to log comment creation', error);
        }
    }

    async logMemberJoined(
        userId: string,
        projectId: string,
        projectName: string,
        memberName: string,
    ): Promise<void> {
        try {
            const request: CreateActivityLogRequest = {
                userId,
                projectId,
                entityId: userId,
                entityType: EntityType.PROJECT_MEMBER,
                action: ActivityAction.JOIN,
                description: `${memberName}이 프로젝트 "${projectName}"에 참여했습니다.`,
                resourceType: 'project',
                metadata: { projectName, memberName },
            };

            await this.activityLogRepository.create(request);
        } catch (error) {
            this.logger.error('Failed to log member join', error);
        }
    }

    async logMemberLeft(
        userId: string,
        projectId: string,
        projectName: string,
        memberName: string,
    ): Promise<void> {
        try {
            const request: CreateActivityLogRequest = {
                userId,
                projectId,
                entityId: userId,
                entityType: EntityType.PROJECT_MEMBER,
                action: ActivityAction.LEAVE,
                description: `${memberName}이 프로젝트 "${projectName}"에서 나갔습니다.`,
                resourceType: 'project',
                metadata: { projectName, memberName },
            };

            await this.activityLogRepository.create(request);
        } catch (error) {
            this.logger.error('Failed to log member leave', error);
        }
    }
}
