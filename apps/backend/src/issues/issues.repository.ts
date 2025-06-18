import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue, IssueType } from './entities/issue.entity';

@Injectable()
export class IssuesRepository {
    constructor(
        @InjectRepository(Issue)
        private readonly issueRepository: Repository<Issue>,
    ) { }

    async create(issue: Issue): Promise<Issue> {
        return await this.issueRepository.save(issue);
    }

    async save(issue: Issue): Promise<Issue> {
        return await this.issueRepository.save(issue);
    }

    async findById(id: string): Promise<Issue | null> {
        return await this.issueRepository.findOne({
            where: { id },
            relations: ['project', 'author'],
        });
    }

    async findByProjectId(projectId: string): Promise<Issue[]> {
        return await this.issueRepository.find({
            where: { projectId },
            relations: ['project', 'author'],
            order: { createdAt: 'DESC' },
        });
    }

    async findByAuthorId(authorId: string): Promise<Issue[]> {
        return await this.issueRepository.find({
            where: { authorId },
            relations: ['project', 'author'],
            order: { createdAt: 'DESC' },
        });
    }

    async findAll(): Promise<Issue[]> {
        return await this.issueRepository.find({
            relations: ['project', 'author'],
            order: { createdAt: 'DESC' },
        });
    }

    async delete(id: string): Promise<void> {
        await this.issueRepository.delete(id);
    }

    async searchIssues(query: string, projectId?: string): Promise<Issue[]> {
        const queryBuilder = this.issueRepository
            .createQueryBuilder('issue')
            .leftJoinAndSelect('issue.project', 'project')
            .leftJoinAndSelect('issue.author', 'author')
            .where('issue.title ILIKE :query OR issue.description ILIKE :query', {
                query: `%${query}%`,
            });

        if (projectId) {
            queryBuilder.andWhere('issue.projectId = :projectId', { projectId });
        }

        return await queryBuilder
            .orderBy('issue.createdAt', 'DESC')
            .getMany();
    }

    async findWithFilters(filters: {
        projectId?: string;
        type?: IssueType;
        authorId?: string;
    }): Promise<Issue[]> {
        const queryBuilder = this.issueRepository
            .createQueryBuilder('issue')
            .leftJoinAndSelect('issue.project', 'project')
            .leftJoinAndSelect('issue.author', 'author');

        if (filters.projectId) {
            queryBuilder.andWhere('issue.projectId = :projectId', {
                projectId: filters.projectId,
            });
        }

        if (filters.type) {
            queryBuilder.andWhere('issue.type = :type', { type: filters.type });
        }

        if (filters.authorId) {
            queryBuilder.andWhere('issue.authorId = :authorId', {
                authorId: filters.authorId,
            });
        }

        return await queryBuilder
            .orderBy('issue.createdAt', 'DESC')
            .getMany();
    }
}
