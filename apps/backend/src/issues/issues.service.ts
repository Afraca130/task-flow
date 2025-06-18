import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ActivityLogService } from '../activity-logs/activity-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { CreateIssueDto } from './dto/request/create-issue.dto';
import { UpdateIssueDto } from './dto/request/update-issue.dto';
import { Issue, IssuePriority, IssueStatus, IssueType } from './entities/issue.entity';
import { IssueServiceInterface } from './interfaces/issue-service.interface';
import { IssuesRepository } from './issues.repository';


@Injectable()
export class IssuesService implements IssueServiceInterface {
    private readonly logger = new Logger(IssuesService.name);

    constructor(
        @Inject(IssuesRepository)
        private readonly issuesRepository: IssuesRepository,
        private readonly activityLogService: ActivityLogService,
        private readonly notificationsService: NotificationsService,
        private readonly usersService: UsersService,
    ) { }

    /**
     * Create issue
     */
    async createIssue(userId: string, createDto: CreateIssueDto): Promise<Issue> {
        this.logger.log(`Creating issue: ${createDto.title}`);

        try {
            const issue = Issue.create(
                createDto.title,
                createDto.description,
                userId,
                createDto.projectId,
                createDto.assigneeId,
                createDto.priority || IssuePriority.MEDIUM,
                createDto.type || IssueType.BUG,
                createDto.labels
            );

            const savedIssue = await this.issuesRepository.save(issue);
            this.logger.log(`Issue created successfully: ${savedIssue.id}`);

            // Log activity
            await this.activityLogService.logIssueCreated(
                userId,
                createDto.projectId,
                savedIssue.id,
                savedIssue.title,
                savedIssue.type,
                savedIssue.priority
            );

            // Send assignment notification
            if (createDto.assigneeId && createDto.assigneeId !== userId) {
                try {
                    const creator = await this.usersService.findById(userId);
                    await this.notificationsService.createIssueAssignmentNotification(
                        createDto.assigneeId,
                        creator?.name || 'Someone',
                        savedIssue.title,
                        savedIssue.id
                    );
                } catch (error) {
                    this.logger.error('Failed to send assignment notification:', error);
                }
            }

            return savedIssue;
        } catch (error) {
            this.logger.error(`Failed to create issue: ${createDto.title}`, error.stack || error);
            throw error;
        }
    }

    /**
     * Create issue with mentions
     */
    async createIssueWithMentions(
        userId: string,
        createDto: CreateIssueDto,
        mentionedUserIds: string[] = []
    ): Promise<Issue> {
        this.logger.log(`🚀 Creating issue with mentions: ${createDto.title}`);
        this.logger.log(`👤 Creator: ${userId}`);
        this.logger.log(`👥 Mentioned users: ${mentionedUserIds.length > 0 ? mentionedUserIds.join(', ') : 'none'}`);
        this.logger.log(`📁 Project: ${createDto.projectId}`);

        try {
            // Create the issue first
            const issue = await this.createIssue(userId, createDto);
            this.logger.log(`✅ Issue created successfully: ${issue.id}`);

            // Send mention notifications if there are users to mention
            if (mentionedUserIds.length > 0) {
                try {
                    this.logger.log(`🔔 Processing mention notifications for ${mentionedUserIds.length} users`);

                    // Get creator details
                    const creator = await this.usersService.findById(userId);
                    if (!creator) {
                        this.logger.error(`💥 Creator not found: ${userId}`);
                        throw new Error(`Creator not found: ${userId}`);
                    }

                    const creatorName = creator.name || 'Someone';
                    this.logger.log(`👤 Creator details: ${creatorName} (${userId})`);

                    // Filter out the creator from mentions (don't notify yourself)
                    const filteredMentionedUserIds = mentionedUserIds.filter(id => id !== userId);
                    this.logger.log(`🎯 Filtered mentioned users (excluding creator): ${filteredMentionedUserIds.length > 0 ? filteredMentionedUserIds.join(', ') : 'none'}`);

                    if (filteredMentionedUserIds.length > 0) {
                        // Create mention notifications
                        const notifications = await this.notificationsService.createIssueMentionNotifications(
                            filteredMentionedUserIds,
                            creatorName,
                            issue.title,
                            issue.id
                        );

                        this.logger.log(`✅ Created ${notifications.length} mention notifications`);
                        notifications.forEach((notification, index) => {
                            this.logger.log(`📧 Mention notification ${index + 1}:`, {
                                id: notification.id,
                                userId: notification.userId,
                                type: notification.type,
                                title: notification.title,
                                message: notification.message,
                                data: notification.data
                            });
                        });
                    } else {
                        this.logger.log(`⚠️ No users to mention after filtering (all mentioned users were the creator)`);
                    }
                } catch (error) {
                    this.logger.error(`💥 Failed to send mention notifications:`, {
                        error: error.message,
                        stack: error.stack,
                        mentionedUserIds,
                        issueId: issue.id
                    });
                    // Don't fail the issue creation if notification fails
                }
            } else {
                this.logger.log(`⚠️ No users to mention, skipping notifications`);
            }

            this.logger.log(`🎉 Issue creation with mentions completed successfully: ${issue.id}`);
            return issue;

        } catch (error) {
            this.logger.error(`💥 Failed to create issue with mentions:`, {
                error: error.message,
                stack: error.stack,
                createDto,
                mentionedUserIds,
                userId
            });
            throw error;
        }
    }

    /**
     * Update issue
     */
    async updateIssue(userId: string, issueId: string, updateDto: UpdateIssueDto): Promise<Issue> {
        this.logger.log(`Updating issue: ${issueId}`);

        try {
            const issue = await this.issuesRepository.findById(issueId);
            if (!issue) {
                throw new NotFoundException('Issue not found');
            }

            const oldValues = {
                status: issue.status,
                priority: issue.priority,
                assigneeId: issue.assigneeId,
            };

            // Update issue fields
            if (updateDto.title) issue.updateTitle(updateDto.title);
            if (updateDto.description) issue.updateDescription(updateDto.description);
            if (updateDto.status) issue.updateStatus(updateDto.status);
            if (updateDto.priority) issue.updatePriority(updateDto.priority);
            if (updateDto.assigneeId) issue.updateAssignee(updateDto.assigneeId);
            if (updateDto.labels) issue.updateLabels(updateDto.labels);

            const updatedIssue = await this.issuesRepository.save(issue);
            this.logger.log(`Issue updated successfully: ${updatedIssue.id}`);

            // Log specific changes
            if (updateDto.status && oldValues.status !== updateDto.status) {
                await this.activityLogService.logIssueStatusChanged(
                    userId,
                    updatedIssue.projectId,
                    updatedIssue.id,
                    updatedIssue.title,
                    oldValues.status,
                    updateDto.status
                );
            }

            if (updateDto.priority && oldValues.priority !== updateDto.priority) {
                await this.activityLogService.logIssuePriorityChanged(
                    userId,
                    updatedIssue.projectId,
                    updatedIssue.id,
                    updatedIssue.title,
                    oldValues.priority,
                    updateDto.priority
                );
            }

            if (updateDto.assigneeId && oldValues.assigneeId !== updateDto.assigneeId) {
                // TODO: Get assignee name from user service
                await this.activityLogService.logIssueAssigned(
                    userId,
                    updatedIssue.projectId,
                    updatedIssue.id,
                    updatedIssue.title,
                    updateDto.assigneeId,
                    'Assignee' // Placeholder - should get actual name
                );
            }

            // Log general update if no specific changes logged
            if (!updateDto.status && !updateDto.priority && !updateDto.assigneeId) {
                await this.activityLogService.logIssueUpdated(
                    userId,
                    updatedIssue.projectId,
                    updatedIssue.id,
                    updatedIssue.title,
                    updateDto
                );
            }

            return updatedIssue;
        } catch (error) {
            this.logger.error(`Failed to update issue: ${issueId}`, error.stack || error);
            throw error;
        }
    }

    /**
     * Delete issue
     */
    async deleteIssue(userId: string, issueId: string): Promise<void> {
        this.logger.log(`Deleting issue: ${issueId}`);

        try {
            const issue = await this.issuesRepository.findById(issueId);
            if (!issue) {
                throw new NotFoundException('Issue not found');
            }

            await this.issuesRepository.delete(issueId);
            this.logger.log(`Issue deleted successfully: ${issueId}`);

            // Log activity
            await this.activityLogService.logIssueDeleted(
                userId,
                issue.projectId,
                issueId,
                issue.title
            );
        } catch (error) {
            this.logger.error(`Failed to delete issue: ${issueId}`, error);
            throw error;
        }
    }

    /**
     * Get issue by ID
     */
    async getIssueById(issueId: string): Promise<Issue | null> {
        return await this.issuesRepository.findById(issueId);
    }

    /**
     * Get issues by project
     */
    async getIssuesByProject(projectId: string): Promise<Issue[]> {
        return await this.issuesRepository.findByProjectId(projectId);
    }

    /**
     * Get issues by assignee
     */
    async getIssuesByAssignee(assigneeId: string): Promise<Issue[]> {
        return await this.issuesRepository.findByAssigneeId(assigneeId);
    }

    /**
     * Get issues by author (previously called reporter)
     */
    async getIssuesByAuthor(authorId: string): Promise<Issue[]> {
        return await this.issuesRepository.findByAuthorId(authorId);
    }

    /**
     * Get all issues
     */
    async getAllIssues(): Promise<Issue[]> {
        return await this.issuesRepository.findAll();
    }

    /**
     * Search issues
     */
    async searchIssues(query: string, projectId?: string): Promise<Issue[]> {
        return await this.issuesRepository.searchIssues(query, projectId);
    }

    /**
     * Get issues with filters
     */
    async getIssuesWithFilters(filters: {
        projectId?: string;
        status?: IssueStatus;
        priority?: IssuePriority;
        type?: IssueType;
        assigneeId?: string;
        authorId?: string;
        labels?: string[];
    }): Promise<Issue[]> {
        return await this.issuesRepository.findWithFilters(filters);
    }
}
