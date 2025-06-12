import { Project } from '../../../domain/entities/project.entity';
import { ProjectId } from '../../../domain/value-objects/project-id.vo';

export interface ProjectRepositoryPort {
    /**
     * Create a new project
     */
    create(project: Project): Promise<Project>;

    /**
     * Find project by ID with user access validation
     */
    findByIdWithAccess(projectId: ProjectId, userId: string): Promise<Project | null>;

    /**
     * Find project by ID (without access validation)
     */
    findById(projectId: ProjectId): Promise<Project | null>;

    /**
     * Find all projects for a user
     */
    findByUserId(
        userId: string,
        options?: {
            page?: number;
            limit?: number;
            search?: string;
            isActive?: boolean;
        }
    ): Promise<{
        projects: Project[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;

    /**
     * Update project
     */
    update(project: Project): Promise<Project>;

    /**
     * Delete project
     */
    delete(projectId: ProjectId): Promise<void>;

    /**
     * Check if project exists by name for a user
     */
    existsByNameAndUserId(name: string, userId: string): Promise<boolean>;

    /**
     * Count members in a project
     */
    countMembers(projectId: ProjectId): Promise<number>;

    /**
     * Count tasks in a project
     */
    countTasks(projectId: ProjectId): Promise<number>;
}
