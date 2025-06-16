import { Inject, Injectable } from '@nestjs/common';
import { ProjectId } from '../common/value-objects/project-id.vo';
import { ProjectNotFoundException } from '../exceptions/domain.exception';
import { GetProjectPort } from './interfaces/get-project.port';
import { ProjectRepositoryPort } from './interfaces/project-repository.port';
import { Project } from './entities/project.entity';
import { GetProjectQuery } from './get-project.query';


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
