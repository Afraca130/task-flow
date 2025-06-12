import { Project } from '../../../domain/entities/project.entity';
import { GetProjectQuery, GetProjectsQuery } from '../../queries/get-project.query';

/**
 * Get Project Port
 * Defines the contract for retrieving a single project
 */
export interface GetProjectPort {
    execute(query: GetProjectQuery): Promise<Project>;
}

/**
 * Get Projects Port
 * Defines the contract for retrieving multiple projects
 */
export interface GetProjectsPort {
    execute(query: GetProjectsQuery): Promise<{
        projects: Project[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
