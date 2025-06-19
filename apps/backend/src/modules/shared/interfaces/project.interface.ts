import { ProjectMember } from '../../projects/entities/project-member.entity';
import { Project } from '../../projects/entities/project.entity';

export interface IProjectService {
    getProjectById(projectId: string, userId: string): Promise<Project | null>;
    hasAccess(projectId: string, userId: string): Promise<boolean>;
    getProjectMembers(projectId: string, userId: string): Promise<ProjectMember[]>;
    addMember(projectId: string, userId: string, role?: any): Promise<void>;
}
