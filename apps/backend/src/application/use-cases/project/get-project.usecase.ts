import { Inject, Injectable } from '@nestjs/common';
import { Project } from '../../../domain/entities/project.entity';
import { ProjectNotFoundException } from '../../../domain/exceptions/domain.exception';
import { ProjectId } from '../../../domain/value-objects/project-id.vo';
import { GetProjectPort } from '../../ports/input/get-project.port';
import { ProjectRepositoryPort } from '../../ports/output/project-repository.port';
import { GetProjectQuery } from '../../queries/get-project.query';

/**
 * Get Project Use Case
 * Handles the business logic for retrieving a single project
 */
@Injectable()
export class GetProjectUseCase implements GetProjectPort {
    constructor(
        @Inject('ProjectRepositoryPort')
        private readonly projectRepository: ProjectRepositoryPort,
    ) { }

    async execute(query: GetProjectQuery): Promise<Project> {
        const projectId = ProjectId.create(query.projectId);

        // Find project with access validation
        const project = await this.projectRepository.findByIdWithAccess(
            projectId,
            query.userId
        );

        if (!project) {
            throw new ProjectNotFoundException(query.projectId);
        }

        return project;
    }
}
