import { CreateProjectCommand } from "../create-project.command";
import { Project } from "../entities/project.entity";

/**
 * Create Project Port
 * Defines the contract for creating a project
 */
export interface CreateProjectPort {
    execute(command: CreateProjectCommand): Promise<Project>;
}
