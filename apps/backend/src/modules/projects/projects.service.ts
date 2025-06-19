import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TimeUtil } from 'src/common/utils/time.util';
import { ActivityLogService } from '../activity-logs/activity-log.service';
import { CreateProjectDto } from './dto/request/create-project.dto';
import { UpdateProjectDto } from './dto/request/update-project.dto';
import { ProjectMember, ProjectMemberRole } from './entities/project-member.entity';
import { Project, ProjectPriority } from './entities/project.entity';
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
        @InjectRepository(ProjectMember)
        private readonly projectMemberRepository: Repository<ProjectMember>,
    ) { }

    /**
     * Create a new project
     */
    async createProject(createProjectDto: CreateProjectDto, userId: string): Promise<Project> {
        this.logger.log(`Creating project: ${createProjectDto.name} for user: ${userId}`);

        try {
            // Validate business rules
            await this.validateProjectCreation(createProjectDto, userId);

            // Create project entity
            const project = new Project();
            project.name = createProjectDto.name.trim();
            project.description = createProjectDto.description?.trim();
            project.ownerId = userId;
            project.color = createProjectDto.color || '#3B82F6';
            project.priority = createProjectDto.priority || ProjectPriority.MEDIUM;
            project.dueDate = createProjectDto.dueDate;
            project.isPublic = createProjectDto.isPublic || false;
            project.isActive = true;

            // Persist the project
            const savedProject = await this.projectRepository.create(project);

            // Add creator as owner
            await this.addMember(savedProject.id, userId, ProjectMemberRole.OWNER);

            // Log project creation activity
            await this.activityLogService.logProjectCreated(
                userId,
                savedProject.id,
                savedProject.name
            );

            this.logger.log(`Project created successfully: ${savedProject.id} - ${savedProject.name}`);
            return savedProject;

        } catch (error) {
            this.logger.error(`Failed to create project: ${createProjectDto.name} for user: ${userId}`, error.stack || error);
            throw error;
        }
    }

    /**
     * Get project by ID with access validation
     */
    async getProjectById(projectId: string, userId: string): Promise<Project> {
        this.logger.log(`Getting project by ID: ${projectId} for user: ${userId}`);

        try {
            // Find project with access validation
            const project = await this.projectRepository.findById(projectId);

            if (!project) {
                throw new NotFoundException(`Project with id ${projectId} not found`);
            }

            // Check if user has access to this project
            const hasAccess = await this.hasAccess(projectId, userId);
            if (!hasAccess) {
                throw new ForbiddenException('You do not have access to this project');
            }

            this.logger.log(`Project retrieved successfully: ${project.id} - ${project.name}`);
            return project;

        } catch (error) {
            this.logger.error(`Failed to get project by ID: ${projectId} for user: ${userId}`, error.stack || error);
            throw error;
        }
    }

    /**
     * Get user projects (projects where user is a member)
     */
    async getUserProjects(
        userId: string,
        options: GetProjectsOptions,
    ): Promise<{
        projects: Project[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        try {
            const result = await this.projectRepository.findByUserId(userId, options);

            // Calculate accurate member and task counts for each project
            const projectsWithCounts = await Promise.all(
                result.projects.map(async (project) => {
                    try {
                        const memberCount = project.members ? project.members.length : 0;
                        const taskCount = project.tasks ? project.tasks.length : 0;

                        this.logger.log(`Project ${project.name}: ${memberCount} members, ${taskCount} tasks`);

                        // Add counts to the project object
                        (project as any).memberCount = memberCount;
                        (project as any).taskCount = taskCount;

                        return project;
                    } catch (error) {
                        this.logger.error(`Failed to calculate counts for project ${project.id}:`, error);
                        (project as any).memberCount = 0;
                        (project as any).taskCount = 0;
                        return project;
                    }
                })
            );

            this.logger.log(`Found ${result.projects.length} projects for user: ${userId}`);

            return {
                ...result,
                projects: projectsWithCounts,
            };
        } catch (error) {
            this.logger.error(`Failed to get projects for user: ${userId}`, error.stack || error);
            throw error;
        }
    }

    /**
     * Get all public projects
     */
    async getAllPublicProjects(options: {
        page: number;
        limit: number;
        search?: string;
    }): Promise<{
        projects: Project[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        try {
            this.logger.log(`Getting all public projects with options:`, options);

            const result = await this.projectRepository.findAllProjects({
                page: options.page,
                limit: options.limit,
                search: options.search,
                isActive: true, // Only show active projects
            });

            // Calculate accurate member and task counts for each project
            const projectsWithCounts = await Promise.all(
                result.projects.map(async (project) => {
                    try {
                        const memberCount = project.members ? project.members.length : 0;
                        const taskCount = project.tasks ? project.tasks.length : 0;

                        this.logger.log(`Public project ${project.name}: ${memberCount} members, ${taskCount} tasks`);

                        // Add counts to the project object
                        (project as any).memberCount = memberCount;
                        (project as any).taskCount = taskCount;

                        return project;
                    } catch (error) {
                        this.logger.error(`Failed to calculate counts for project ${project.id}:`, error);
                        (project as any).memberCount = 0;
                        (project as any).taskCount = 0;
                        return project;
                    }
                })
            );

            this.logger.log(`Found ${result.projects.length} public projects`);

            return {
                ...result,
                projects: projectsWithCounts,
            };
        } catch (error) {
            this.logger.error(`Failed to get public projects`, error.stack || error);
            throw error;
        }
    }

    /**
     * Update project
     */
    async updateProject(
        projectId: string,
        updateData: UpdateProjectDto,
        userId: string,
    ): Promise<Project> {
        this.logger.log(`Updating project: ${projectId} by user: ${userId}`);

        try {
            // Check if project exists
            const existingProject = await this.projectRepository.findById(projectId);
            if (!existingProject) {
                throw new NotFoundException(`Project with id ${projectId} not found`);
            }

            // Check if user has permission to update (must be owner or manager)
            const membership = await this.projectMemberRepository.findOne({
                where: { projectId, userId }
            });

            if (!membership || (membership.role !== ProjectMemberRole.OWNER && membership.role !== ProjectMemberRole.MANAGER)) {
                throw new ForbiddenException('You do not have permission to update this project');
            }

            // Update project
            const updatedProject = await this.projectRepository.update(projectId, updateData);

            // Log activity
            await this.activityLogService.logProjectUpdated(
                userId,
                projectId,
                existingProject.name,
                Object.keys(updateData)
            );

            this.logger.log(`Project updated successfully: ${projectId}`);
            return updatedProject;

        } catch (error) {
            this.logger.error(`Failed to update project: ${projectId}`, error.stack || error);
            throw error;
        }
    }

    /**
     * Get project members
     */
    async getProjectMembers(projectId: string, userId: string): Promise<ProjectMember[]> {
        // Check if user has access to this project
        const existingProject = await this.projectRepository.findById(projectId);
        if (!existingProject) {
            throw new NotFoundException(`Project with id ${projectId} not found`);
        }

        const membership = await this.projectMemberRepository.findOne({
            where: { projectId, userId }
        });

        if (!membership) {
            throw new ForbiddenException('You do not have access to this project');
        }

        return await this.projectMemberRepository.find({
            where: { projectId },
            relations: ['user']
        });
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
        // Check if current user is owner or manager
        const currentUserMembership = await this.projectMemberRepository.findOne({
            where: { projectId, userId: currentUserId }
        });

        if (!currentUserMembership || (currentUserMembership.role !== ProjectMemberRole.OWNER && currentUserMembership.role !== ProjectMemberRole.MANAGER)) {
            throw new ForbiddenException('You do not have permission to update member roles');
        }

        // Find target member
        const targetMembership = await this.projectMemberRepository.findOne({
            where: { projectId, userId: targetUserId }
        });

        if (!targetMembership) {
            throw new NotFoundException('Member not found in this project');
        }

        // Update role
        targetMembership.role = this.mapRoleStringToEnum(newRole);
        await this.projectMemberRepository.save(targetMembership);

        this.logger.log(`Updated member role: ${targetUserId} to ${newRole} in project ${projectId}`);
    }

    /**
     * Add member to project
     */
    async addMember(projectId: string, userId: string, role: ProjectMemberRole = ProjectMemberRole.MEMBER): Promise<void> {
        try {
            // Check if user is already a member
            const existingMembership = await this.projectMemberRepository.findOne({
                where: { projectId, userId }
            });

            if (existingMembership) {
                this.logger.warn(`User ${userId} is already a member of project ${projectId}`);
                return;
            }

            // Create new membership
            const membership = new ProjectMember();
            membership.projectId = projectId;
            membership.userId = userId;
            membership.role = role;
            membership.joinedAt = TimeUtil.now();

            await this.projectMemberRepository.save(membership);

            this.logger.log(`Added user ${userId} as ${role} to project ${projectId}`);

        } catch (error) {
            this.logger.error(`Failed to add member to project: ${projectId}`, error.stack || error);
            throw error;
        }
    }

    /**
     * Remove project member
     */
    async removeProjectMember(
        projectId: string,
        targetUserId: string,
        currentUserId: string,
    ): Promise<void> {
        // Check if current user has permission (owner or manager)
        const currentUserMembership = await this.projectMemberRepository.findOne({
            where: { projectId, userId: currentUserId }
        });

        if (!currentUserMembership || (currentUserMembership.role !== ProjectMemberRole.OWNER && currentUserMembership.role !== ProjectMemberRole.MANAGER)) {
            throw new ForbiddenException('You do not have permission to remove members');
        }

        // Find target member
        const targetMembership = await this.projectMemberRepository.findOne({
            where: { projectId, userId: targetUserId }
        });

        if (!targetMembership) {
            throw new NotFoundException('Member not found in this project');
        }

        // Cannot remove project owner
        if (targetMembership.role === ProjectMemberRole.OWNER) {
            throw new BadRequestException('Cannot remove project owner');
        }

        // Remove membership
        await this.projectMemberRepository.remove(targetMembership);

        this.logger.log(`Removed user ${targetUserId} from project ${projectId}`);
    }

    /**
     * Delete project
     */
    async deleteProject(projectId: string, userId: string): Promise<void> {
        // Check if user is the owner
        const membership = await this.projectMemberRepository.findOne({
            where: { projectId, userId }
        });

        if (!membership || membership.role !== ProjectMemberRole.OWNER) {
            throw new ForbiddenException('Only project owner can delete the project');
        }

        // Delete project (cascade will handle members, tasks, etc.)
        await this.projectRepository.delete(projectId);

        // Log activity
        await this.activityLogService.logProjectDeleted(userId, projectId);

        this.logger.log(`Project deleted: ${projectId} by user: ${userId}`);
    }

    /**
     * Check if user has access to project
     */
    async hasAccess(projectId: string, userId: string): Promise<boolean> {
        const membership = await this.projectMemberRepository.findOne({
            where: { projectId, userId }
        });

        return !!membership;
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
        // Check access
        const hasAccess = await this.hasAccess(projectId, userId);
        if (!hasAccess) {
            throw new ForbiddenException('You do not have access to this project');
        }

        const project = await this.projectRepository.findById(projectId);
        if (!project) {
            throw new NotFoundException(`Project with id ${projectId} not found`);
        }

        return {
            totalTasks: project.tasks?.length || 0,
            completedTasks: project.tasks?.filter(task => task.status === 'COMPLETED').length || 0,
            inProgressTasks: project.tasks?.filter(task => task.status === 'IN_PROGRESS').length || 0,
            todoTasks: project.tasks?.filter(task => task.status === 'TODO').length || 0,
            memberCount: project.members?.length || 0,
        };
    }

    /**
     * Validate project creation
     */
    private async validateProjectCreation(createProjectDto: CreateProjectDto, userId: string): Promise<void> {
        if (!createProjectDto.name?.trim()) {
            throw new BadRequestException('Project name is required');
        }

        if (createProjectDto.name.trim().length < 2) {
            throw new BadRequestException('Project name must be at least 2 characters long');
        }

        if (createProjectDto.name.trim().length > 100) {
            throw new BadRequestException('Project name must not exceed 100 characters');
        }
    }

    /**
     * Map role string to enum
     */
    private mapRoleStringToEnum(role: string): ProjectMemberRole {
        switch (role.toUpperCase()) {
            case 'OWNER':
                return ProjectMemberRole.OWNER;
            case 'MANAGER':
                return ProjectMemberRole.MANAGER;
            case 'MEMBER':
                return ProjectMemberRole.MEMBER;
            default:
                return ProjectMemberRole.MEMBER;
        }
    }
}
