import { Inject, Injectable } from '@nestjs/common';
import { ApprovalType, Project, ProjectPriority, ProjectStatus } from '../../../domain/entities/project.entity';
import { ProjectAlreadyExistsException } from '../../../domain/exceptions/domain.exception';
import { ProjectName } from '../../../domain/value-objects/project-name.vo';
import { CreateProjectCommand } from '../../commands/create-project.command';
import { CreateProjectPort } from '../../ports/input/create-project.port';
import { ProjectRepositoryPort } from '../../ports/output/project-repository.port';

/**
 * Create Project Use Case
 * Handles the business logic for creating a new project
 */
@Injectable()
export class CreateProjectUseCase implements CreateProjectPort {
    constructor(
        @Inject('ProjectRepositoryPort')
        private readonly projectRepository: ProjectRepositoryPort,
    ) { }

    async execute(command: CreateProjectCommand): Promise<Project> {
        // Validate business rules
        await this.validateProjectCreation(command);

        // Create domain entity
        const project = this.createProjectEntity(command);

        // Persist the project
        return await this.projectRepository.create(project);
    }

    private async validateProjectCreation(command: CreateProjectCommand): Promise<void> {
        // Check if project with same name already exists for the user
        const exists = await this.projectRepository.existsByNameAndUserId(
            command.name,
            command.userId,
        );

        if (exists) {
            throw new ProjectAlreadyExistsException(command.name);
        }
    }

    private createProjectEntity(command: CreateProjectCommand): Project {
        const project = new Project();

        // Validate and set project name using value object
        const projectName = ProjectName.create(command.name);
        project.name = projectName.getValue();

        project.description = command.description;
        project.ownerId = command.userId;
        project.createdBy = command.userId;
        project.status = ProjectStatus.ACTIVE;
        project.isPublic = false;
        project.approvalType = ApprovalType.MANUAL;

        // Set new fields
        project.color = command.color;
        project.iconUrl = command.iconUrl;
        project.priority = this.mapPriorityToDomainEnum(command.priority);

        // Additional properties from DTO
        if (command.dueDate) {
            project.endDate = command.dueDate;
        }

        return project;
    }

    private mapPriorityToDomainEnum(priority: any): ProjectPriority {
        // Map from DTO enum to Domain enum
        switch (priority) {
            case 'LOW':
                return ProjectPriority.LOW;
            case 'MEDIUM':
                return ProjectPriority.MEDIUM;
            case 'HIGH':
                return ProjectPriority.HIGH;
            case 'URGENT':
                return ProjectPriority.URGENT;
            default:
                return ProjectPriority.MEDIUM;
        }
    }
}
