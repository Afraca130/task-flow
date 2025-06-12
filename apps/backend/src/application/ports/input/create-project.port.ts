import { Project } from '../../../domain/entities/project.entity';
import { CreateProjectCommand } from '../../commands/create-project.command';

/**
 * Create Project Port
 * Defines the contract for creating a project
 */
export interface CreateProjectPort {
    execute(command: CreateProjectCommand): Promise<Project>;
}
