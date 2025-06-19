
import { CreateProjectDto } from '../dto/request/create-project.dto';
import { UpdateProjectDto } from '../dto/request/update-project.dto';
import { ProjectMember } from '../entities/project-member.entity';
import { Project } from '../entities/project.entity';

export interface ProjectServiceInterface {
    createProject(userId: string, createDto: CreateProjectDto): Promise<Project>;
    updateProject(userId: string, projectId: string, updateDto: UpdateProjectDto): Promise<Project>;
    deleteProject(userId: string, projectId: string): Promise<void>;
    getProjectById(projectId: string): Promise<Project | null>;
    getUserProjects(userId: string): Promise<Project[]>;
    addMemberToProject(projectId: string, userId: string, role?: string): Promise<ProjectMember>;
    removeMemberFromProject(projectId: string, userId: string): Promise<void>;
    getProjectMembers(projectId: string): Promise<ProjectMember[]>;
    updateMemberRole(projectId: string, userId: string, role: string): Promise<ProjectMember>;
    isProjectMember(projectId: string, userId: string): Promise<boolean>;
    isProjectOwner(projectId: string, userId: string): Promise<boolean>;
}
