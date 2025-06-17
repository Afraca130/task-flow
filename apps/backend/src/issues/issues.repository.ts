import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue, IssuePriority, IssueStatus, IssueType } from './entities/issue.entity';

@Injectable()
export class IssuesRepository {
    constructor(
        @InjectRepository(Issue)
        private readonly repository: Repository<Issue>,
    ) { }

    async save(issue: Issue): Promise<Issue> {
        return await this.repository.save(issue);
    }

    async findById(id: string): Promise<Issue | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ['reporter', 'assignee', 'project', 'comments']
        });
    }

    async findByProjectId(projectId: string): Promise<Issue[]> {
        return await this.repository.find({
            where: { projectId },
            relations: ['reporter', 'assignee'],
            order: { createdAt: 'DESC' }
        });
    }

    async findByAssigneeId(assigneeId: string): Promise<Issue[]> {
        return await this.repository.find({
            where: { assigneeId },
            relations: ['reporter', 'project'],
            order: { createdAt: 'DESC' }
        });
    }

    async findByReporterId(authorId: string): Promise<Issue[]> {
        return await this.repository.find({
            where: { authorId: authorId },
            relations: ['assignee', 'project'],
            order: { createdAt: 'DESC' }
        });
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async searchIssues(query: string, projectId?: string): Promise<Issue[]> {
        const queryBuilder = this.repository.createQueryBuilder('issue');

        queryBuilder
            .leftJoinAndSelect('issue.reporter', 'reporter')
            .leftJoinAndSelect('issue.assignee', 'assignee')
            .leftJoinAndSelect('issue.project', 'project')
            .where('(issue.title ILIKE :query OR issue.description ILIKE :query)', { query: `%${query}%` });

        if (projectId) {
            queryBuilder.andWhere('issue.projectId = :projectId', { projectId });
        }

        return await queryBuilder
            .orderBy('issue.createdAt', 'DESC')
            .getMany();
    }

    async findWithFilters(filters: {
        projectId?: string;
        status?: IssueStatus;
        priority?: IssuePriority;
        type?: IssueType;
        assigneeId?: string;
        reporterId?: string;
        labels?: string[];
    }): Promise<Issue[]> {
        const queryBuilder = this.repository.createQueryBuilder('issue');

        queryBuilder
            .leftJoinAndSelect('issue.reporter', 'reporter')
            .leftJoinAndSelect('issue.assignee', 'assignee')
            .leftJoinAndSelect('issue.project', 'project');

        if (filters.projectId) {
            queryBuilder.andWhere('issue.projectId = :projectId', { projectId: filters.projectId });
        }

        if (filters.status) {
            queryBuilder.andWhere('issue.status = :status', { status: filters.status });
        }

        if (filters.priority) {
            queryBuilder.andWhere('issue.priority = :priority', { priority: filters.priority });
        }

        if (filters.type) {
            queryBuilder.andWhere('issue.type = :type', { type: filters.type });
        }

        if (filters.assigneeId) {
            queryBuilder.andWhere('issue.assigneeId = :assigneeId', { assigneeId: filters.assigneeId });
        }

        if (filters.reporterId) {
            queryBuilder.andWhere('issue.reporterId = :reporterId', { reporterId: filters.reporterId });
        }

        if (filters.labels && filters.labels.length > 0) {
            queryBuilder.andWhere('issue.labels && :labels', { labels: filters.labels });
        }

        return await queryBuilder
            .orderBy('issue.createdAt', 'DESC')
            .getMany();
    }
}
