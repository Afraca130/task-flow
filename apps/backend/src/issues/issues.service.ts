import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ActivityLogService } from '../activity-logs/activity-log.service';
import { CreateIssueDto } from './dto/request/create-issue.dto';
import { UpdateIssueDto } from './dto/request/update-issue.dto';
import { Issue, IssuePriority, IssueStatus, IssueType } from './entities/issue.entity';
import { IssueServiceInterface } from './interfaces/issue-service.interface';
import { IssuesRepository } from './issues.repository';

@Injectable()
export class IssuesService implements IssueServiceInterface {
    private readonly logger = new Logger(IssuesService.name);

    constructor(
        @Inject('IssuesRepository')
        private readonly issuesRepository: IssuesRepository,
        private readonly activityLogService: ActivityLogService,
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

            return savedIssue;
        } catch (error) {
            this.logger.error(`Failed to create issue: ${createDto.title}`, error);
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
            this.logger.error(`Failed to update issue: ${issueId}`, error);
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
     * Get issues by reporter
     */
    async getIssuesByReporter(reporterId: string): Promise<Issue[]> {
        return await this.issuesRepository.findByReporterId(reporterId);
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
        reporterId?: string;
        labels?: string[];
    }): Promise<Issue[]> {
        return await this.issuesRepository.findWithFilters(filters);
    }
}
