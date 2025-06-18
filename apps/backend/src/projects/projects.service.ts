import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ActivityLogService } from '../activity-logs/activity-log.service';
import { ProjectId } from '../common/value-objects/project-id.vo';
import { ProjectName } from '../common/value-objects/project-name.vo';
import { ProjectAlreadyExistsException, ProjectNotFoundException } from '../exceptions/domain.exception';
import { CreateProjectCommand } from './create-project.command';
import { UpdateProjectDto } from './dto/request/update-project.dto';
import { ProjectMember, ProjectMemberRole } from './entities/project-member.entity';
import { ApprovalType, Project, ProjectPriority, ProjectStatus } from './entities/project.entity';
import { GetProjectQuery } from './get-project.query';
import { ProjectRepository } from './project.repository';

export interface GetProjectsOptions {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
}

export interface ProjectsResult {
    projects: Project[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable()
export class ProjectsService {
    private readonly logger = new Logger(ProjectsService.name);

    constructor(
        private readonly projectRepository: ProjectRepository,
        private readonly activityLogService: ActivityLogService,
    ) { }

    /**
     * Create a new project
     * Consolidated from CreateProjectUseCase
     */
    async createProject(command: CreateProjectCommand): Promise<Project> {
        this.logger.log(`Creating project: ${command.name} for user: ${command.userId}`);

        try {
            // Validate business rules
            await this.validateProjectCreation(command);

            // Create domain entity
            const project = this.createProjectEntity(command);

            // Persist the project
            const savedProject = await this.projectRepository.create(project);

            // Log project creation activity
            await this.activityLogService.logProjectCreated(
                command.userId,
                savedProject.id,
                savedProject.name
            );

            this.logger.log(`Project created successfully: ${savedProject.id} - ${savedProject.name}`);
            return savedProject;

        } catch (error) {
            this.logger.error(`Failed to create project: ${command.name} for user: ${command.userId}`, error.stack || error);
            throw error;
        }
    }

    /**
     * Get project by ID with access validation
     * Consolidated from GetProjectUseCase
     */
    async getProjectById(query: GetProjectQuery): Promise<Project> {
        this.logger.log(`Getting project by ID: ${query.projectId} for user: ${query.userId}`);

        try {
            const projectId = ProjectId.create(query.projectId);

            // Find project with access validation
            const project = await this.projectRepository.findByIdWithAccess(
                projectId,
                query.userId
            );

            if (!project) {
                throw new ProjectNotFoundException(query.projectId);
            }

            this.logger.log(`Project retrieved successfully: ${project.id} - ${project.name}`);
            return project;

        } catch (error) {
            this.logger.error(`Failed to get project by ID: ${query.projectId} for user: ${query.userId}`, error.stack || error);
            throw error;
        }
    }

    /**
     * Get projects for a user with pagination and filtering
     * Consolidated from GetProjectsUseCase
     */
    async getUserProjects(
        userId: string,
        options: GetProjectsOptions = {}
    ): Promise<ProjectsResult> {
        const result = await this.projectRepository.findByUserId(
            userId,
            {
                page: options.page || 1,
                limit: options.limit || 10,
                search: options.search,
                isActive: options.isActive,
            }
        );

        // 각 프로젝트에 memberCount와 taskCount 추가
        const projectsWithCounts = result.projects.map(project => {
            const memberCount = project.members ? project.members.length : 0;
            const taskCount = project.tasks ? project.tasks.length : 0;

            // 프로젝트 객체에 count 정보를 추가 (원본 객체를 유지하면서)
            (project as any).memberCount = memberCount;
            (project as any).taskCount = taskCount;

            return project;
        });

        return {
            ...result,
            projects: projectsWithCounts,
        };
    }



    /**
     * Update a project
     */
    async updateProject(
        projectId: string,
        updateData: UpdateProjectDto,
        userId: string,
    ): Promise<Project> {
        // Validate access
        const project = await this.getProjectById(new GetProjectQuery(projectId, userId));

        // Validate name uniqueness if name is being updated
        if (updateData.name && updateData.name !== project.name) {
            const exists = await this.projectRepository.existsByNameAndUserId(
                updateData.name,
                userId,
            );
            if (exists) {
                throw new ProjectAlreadyExistsException(updateData.name);
            }

            // Validate name using value object
            const projectName = ProjectName.create(updateData.name);
            project.name = projectName.getValue();
        }

        // Update other fields
        if (updateData.description !== undefined) {
            project.description = updateData.description;
        }

        if (updateData.color !== undefined) {
            project.color = updateData.color;
        }

        if (updateData.iconUrl !== undefined) {
            project.iconUrl = updateData.iconUrl;
        }

        if (updateData.priority !== undefined) {
            project.priority = this.mapPriorityToDomainEnum(updateData.priority);
        }

        if (updateData.dueDate !== undefined) {
            project.endDate = new Date(updateData.dueDate);
        }

        if (updateData.isActive !== undefined) {
            project.status = updateData.isActive ? ProjectStatus.ACTIVE : ProjectStatus.ARCHIVED;
        }

        if (updateData.isPublic !== undefined) {
            project.isPublic = updateData.isPublic;
        }

        return await this.projectRepository.update(project);
    }

    /**
     * Get project members
     */
    async getProjectMembers(projectId: string, userId: string): Promise<ProjectMember[]> {
        // Validate access
        const project = await this.getProjectById(new GetProjectQuery(projectId, userId));

        return project.members || [];
    }

    /**
     * Update member role
     */
    async updateMemberRole(
        projectId: string,
        targetUserId: string,
        newRole: 'OWNER' | 'MANAGER' | 'MEMBER',
        currentUserId: string,
    ): Promise<void> {
        // Validate access
        const project = await this.getProjectById(new GetProjectQuery(projectId, currentUserId));

        // Check if current user has permission to change roles
        const currentUserMember = project.members?.find(m => m.userId === currentUserId);
        if (!currentUserMember || !currentUserMember.isOwner()) {
            throw new ForbiddenException('Only project owners can change member roles');
        }

        // Find target member
        const targetMember = project.members?.find(m => m.userId === targetUserId);
        if (!targetMember) {
            throw new NotFoundException('Member not found in project');
        }

        // Update role
        const memberRole = this.mapRoleStringToEnum(newRole);
        targetMember.changeRole(memberRole);

        // Save changes
        await this.projectRepository.update(project);
    }

    /**
     * Remove project member
     */
    async removeProjectMember(
        projectId: string,
        targetUserId: string,
        currentUserId: string,
    ): Promise<void> {
        // Validate access
        const project = await this.getProjectById(new GetProjectQuery(projectId, currentUserId));

        // Check if current user has permission to remove members
        const currentUserMember = project.members?.find(m => m.userId === currentUserId);
        const targetMember = project.members?.find(m => m.userId === targetUserId);

        if (!targetMember) {
            throw new NotFoundException('Member not found in project');
        }

        // Only owners and managers can remove members, but members can leave themselves
        const canRemove = currentUserMember && (
            currentUserMember.isOwner() ||
            currentUserMember.isManager() ||
            currentUserId === targetUserId
        );

        if (!canRemove) {
            throw new ForbiddenException('Insufficient permissions to remove member');
        }

        // Cannot remove owner
        if (targetMember.isOwner()) {
            throw new BadRequestException('Cannot remove project owner');
        }

        // Remove member from project
        project.members = project.members?.filter(m => m.userId !== targetUserId) || [];

        // Save changes
        await this.projectRepository.update(project);
    }

    /**
     * Delete/archive a project
     */
    async deleteProject(projectId: string, userId: string): Promise<void> {
        // Validate access
        const project = await this.getProjectById(new GetProjectQuery(projectId, userId));

        // Check if user is owner
        const currentUserMember = project.members?.find(m => m.userId === userId);
        if (!currentUserMember || !currentUserMember.isOwner()) {
            throw new ForbiddenException('Only project owners can delete projects');
        }

        // Log project deletion activity before deletion
        await this.activityLogService.logProjectUpdated(
            userId,
            project.id,
            project.name,
            { status: { from: project.status, to: 'DELETED' } }
        );

        const projectIdVO = ProjectId.create(projectId);
        await this.projectRepository.delete(projectIdVO);
    }

    /**
     * Check if user has access to project
     */
    async hasAccess(projectId: string, userId: string): Promise<boolean> {
        try {
            await this.getProjectById(new GetProjectQuery(projectId, userId));
            return true;
        } catch (error) {
            if (error instanceof ProjectNotFoundException) {
                return false;
            }
            throw error;
        }
    }

    /**
     * Get project statistics
     */
    async getProjectStats(projectId: string, userId: string): Promise<{
        totalTasks: number;
        completedTasks: number;
        inProgressTasks: number;
        todoTasks: number;
        memberCount: number;
    }> {
        // Validate access first
        const project = await this.getProjectById(new GetProjectQuery(projectId, userId));

        // Return basic stats for now - can be extended with actual task counting
        return {
            totalTasks: 0,
            completedTasks: 0,
            inProgressTasks: 0,
            todoTasks: 0,
            memberCount: 1, // At least the owner
        };
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
        // Map from DTO to domain enum
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
                throw new Error('Invalid priority format');
        }
    }

    private mapRoleStringToEnum(role: string): ProjectMemberRole {
        // Map from string to ProjectMemberRole
        switch (role) {
            case 'OWNER':
                return ProjectMemberRole.OWNER;
            case 'MANAGER':
                return ProjectMemberRole.MANAGER;
            case 'MEMBER':
                return ProjectMemberRole.MEMBER;
            default:
                throw new BadRequestException('Invalid role format');
        }
    }
}
