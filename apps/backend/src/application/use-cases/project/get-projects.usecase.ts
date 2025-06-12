import { Inject, Injectable } from '@nestjs/common';
import { Project } from '../../../domain/entities/project.entity';
import { GetProjectsPort } from '../../ports/input/get-project.port';
import { ProjectRepositoryPort } from '../../ports/output/project-repository.port';
import { GetProjectsQuery } from '../../queries/get-project.query';

/**
 * Get Projects Use Case
 * Handles the business logic for retrieving multiple projects
 */
@Injectable()
export class GetProjectsUseCase implements GetProjectsPort {
    constructor(
        @Inject('ProjectRepositoryPort')
        private readonly projectRepository: ProjectRepositoryPort,
    ) { }

    async execute(query: GetProjectsQuery): Promise<{
        projects: Project[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const result = await this.projectRepository.findByUserId(
            query.userId,
            {
                page: query.options.page || 1,
                limit: query.options.limit || 10,
                search: query.options.search,
                isActive: query.options.isActive,
            }
        );

        return result;
    }
}
