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
        assigneeId?: string,
    ): Promise<void> {
        try {
            const request: CreateActivityLogRequest = {
                userId,
                projectId,
                entityId: taskId,
                entityType: EntityType.TASK,
                action: ActivityAction.CREATE,
                description: `새 작업 "${taskTitle}"을(를) 생성했습니다.`,
                resourceType: 'task',
                metadata: { taskTitle, assigneeId },
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
                description: `작업 "${taskTitle}"을(를) 수정했습니다.`,
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
                description: `작업 "${taskTitle}" 상태를 ${oldStatus}에서 ${newStatus}로 변경했습니다.`,
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
                description: `작업 "${taskTitle}"을(를) ${assigneeName}에게 할당했습니다.`,
                resourceType: 'task',
                metadata: { taskTitle, assigneeId, assigneeName },
            };

            await this.activityLogRepository.create(request);
            this.logger.log(`Activity log created for task assignment: ${taskId}`);
        } catch (error) {
            this.logger.error(`Failed to log task assignment: ${taskId}`, error);
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
                description: `작업 "${taskTitle}"을(를) 삭제했습니다.`,
                resourceType: 'task',
                metadata: { taskTitle },
            };

            await this.activityLogRepository.create(request);
            this.logger.log(`Activity log created for task deletion: ${taskId}`);
        } catch (error) {
            this.logger.error(`Failed to log task deletion: ${taskId}`, error);
        }
    }

    async logTaskPriorityChanged(
        userId: string,
        projectId: string,
        taskId: string,
        taskTitle: string,
        oldPriority: string,
        newPriority: string,
    ): Promise<void> {
        try {
            const request: CreateActivityLogRequest = {
                userId,
                projectId,
                entityId: taskId,
                entityType: EntityType.TASK,
                action: ActivityAction.PRIORITY_CHANGE,
                description: `작업 "${taskTitle}" 우선순위를 ${oldPriority}에서 ${newPriority}로 변경했습니다.`,
                resourceType: 'task',
                metadata: { taskTitle, oldPriority, newPriority },
            };

            await this.activityLogRepository.create(request);
            this.logger.log(`Activity log created for task priority change: ${taskId}`);
        } catch (error) {
            this.logger.error(`Failed to log task priority change: ${taskId}`, error);
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
        changes: string[],
    ): Promise<void> {
        try {
            const request: CreateActivityLogRequest = {
                userId,
                projectId,
                entityId: projectId,
                entityType: EntityType.PROJECT,
                action: ActivityAction.UPDATE,
                description: `프로젝트 "${projectName}"을(를) 수정했습니다.`,
                resourceType: 'project',
                metadata: { projectName, changes },
            };

            await this.activityLogRepository.create(request);
            this.logger.log(`Activity log created for project update: ${projectId}`);
        } catch (error) {
            this.logger.error(`Failed to log project update: ${projectId}`, error);
        }
    }

    async logProjectDeleted(
        userId: string,
        projectId: string,
    ): Promise<void> {
        try {
            const request: CreateActivityLogRequest = {
                userId,
                projectId,
                entityId: projectId,
                entityType: EntityType.PROJECT,
                action: ActivityAction.DELETE,
                description: `프로젝트를 삭제했습니다.`,
                resourceType: 'project',
                metadata: { projectId },
            };

            await this.activityLogRepository.create(request);
            this.logger.log(`Activity log created for project deletion: ${projectId}`);
        } catch (error) {
            this.logger.error(`Failed to log project deletion: ${projectId}`, error);
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
                action: ActivityAction.CREATE,
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

    // Issue-related activity logs
    async logIssueCreated(
        userId: string,
        projectId: string,
        issueId: string,
        issueTitle: string,
        issueType: string,
        priority: string,
    ): Promise<void> {
        try {
            const request: CreateActivityLogRequest = {
                userId,
                projectId,
                entityId: issueId,
                entityType: EntityType.ISSUE,
                action: ActivityAction.CREATE,
                description: `새 이슈 "${issueTitle}"을(를) 생성했습니다.`,
                resourceType: 'issue',
                metadata: { issueTitle, issueType, priority },
            };

            await this.activityLogRepository.create(request);
            this.logger.log(`Activity log created for issue creation: ${issueId}`);
        } catch (error) {
            this.logger.error(`Failed to log issue creation: ${issueId}`, error);
        }
    }

    async logIssueUpdated(
        userId: string,
        projectId: string,
        issueId: string,
        issueTitle: string,
        changes: Record<string, any>,
    ): Promise<void> {
        try {
            const request: CreateActivityLogRequest = {
                userId,
                projectId,
                entityId: issueId,
                entityType: EntityType.ISSUE,
                action: ActivityAction.UPDATE,
                description: `이슈 "${issueTitle}"을(를) 수정했습니다.`,
                resourceType: 'issue',
                metadata: { issueTitle, changes },
            };

            await this.activityLogRepository.create(request);
            this.logger.log(`Activity log created for issue update: ${issueId}`);
        } catch (error) {
            this.logger.error(`Failed to log issue update: ${issueId}`, error);
        }
    }

    async logIssueStatusChanged(
        userId: string,
        projectId: string,
        issueId: string,
        issueTitle: string,
        oldStatus: string,
        newStatus: string,
    ): Promise<void> {
        try {
            const request: CreateActivityLogRequest = {
                userId,
                projectId,
                entityId: issueId,
                entityType: EntityType.ISSUE,
                action: ActivityAction.STATUS_CHANGE,
                description: `이슈 "${issueTitle}" 상태를 ${oldStatus}에서 ${newStatus}로 변경했습니다.`,
                resourceType: 'issue',
                metadata: { issueTitle, oldStatus, newStatus },
            };

            await this.activityLogRepository.create(request);
            this.logger.log(`Activity log created for issue status change: ${issueId}`);
        } catch (error) {
            this.logger.error(`Failed to log issue status change: ${issueId}`, error);
        }
    }

    async logIssueAssigned(
        userId: string,
        projectId: string,
        issueId: string,
        issueTitle: string,
        assigneeId: string,
        assigneeName: string,
    ): Promise<void> {
        try {
            const request: CreateActivityLogRequest = {
                userId,
                projectId,
                entityId: issueId,
                entityType: EntityType.ISSUE,
                action: ActivityAction.ASSIGN,
                description: `이슈 "${issueTitle}"을(를) ${assigneeName}에게 할당했습니다.`,
                resourceType: 'issue',
                metadata: { issueTitle, assigneeId, assigneeName },
            };

            await this.activityLogRepository.create(request);
            this.logger.log(`Activity log created for issue assignment: ${issueId}`);
        } catch (error) {
            this.logger.error(`Failed to log issue assignment: ${issueId}`, error);
        }
    }

    async logIssueDeleted(
        userId: string,
        projectId: string,
        issueId: string,
        issueTitle: string,
    ): Promise<void> {
        try {
            const request: CreateActivityLogRequest = {
                userId,
                projectId,
                entityId: issueId,
                entityType: EntityType.ISSUE,
                action: ActivityAction.DELETE,
                description: `이슈 "${issueTitle}"을(를) 삭제했습니다.`,
                resourceType: 'issue',
                metadata: { issueTitle },
            };

            await this.activityLogRepository.create(request);
            this.logger.log(`Activity log created for issue deletion: ${issueId}`);
        } catch (error) {
            this.logger.error(`Failed to log issue deletion: ${issueId}`, error);
        }
    }

    async logIssuePriorityChanged(
        userId: string,
        projectId: string,
        issueId: string,
        issueTitle: string,
        oldPriority: string,
        newPriority: string,
    ): Promise<void> {
        try {
            const request: CreateActivityLogRequest = {
                userId,
                projectId,
                entityId: issueId,
                entityType: EntityType.ISSUE,
                action: ActivityAction.PRIORITY_CHANGE,
                description: `이슈 "${issueTitle}" 우선순위를 ${oldPriority}에서 ${newPriority}로 변경했습니다.`,
                resourceType: 'issue',
                metadata: { issueTitle, oldPriority, newPriority },
            };

            await this.activityLogRepository.create(request);
            this.logger.log(`Activity log created for issue priority change: ${issueId}`);
        } catch (error) {
            this.logger.error(`Failed to log issue priority change: ${issueId}`, error);
        }
    }
}
