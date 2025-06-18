import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ProjectId } from '../common/value-objects/project-id.vo';
import { Task } from '../tasks/entities/task.entity';
import { ProjectMember, ProjectMemberRole } from './entities/project-member.entity';
import { Project } from './entities/project.entity';


/**
 * Project Repository Implementation
 * Handles data persistence for Project aggregate
 */
@Injectable()
export class ProjectRepository {
    constructor(
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
        @InjectRepository(ProjectMember)
        private readonly projectMemberRepository: Repository<ProjectMember>,
    ) { }

    async create(project: Project): Promise<Project> {
        const savedProject = await this.projectRepository.save(project);

        // Create initial project member entry for owner
        const projectMember = new ProjectMember();
        projectMember.projectId = savedProject.id;
        projectMember.userId = savedProject.ownerId;
        projectMember.role = ProjectMemberRole.OWNER;
        projectMember.joinedAt = new Date();

        await this.projectMemberRepository.save(projectMember);

        return savedProject;
    }

    async findByIdWithAccess(projectId: ProjectId, userId: string): Promise<Project | null> {
        const queryBuilder = this.projectRepository
            .createQueryBuilder('project')
            .leftJoinAndSelect('project.members', 'member')
            .leftJoinAndSelect('member.user', 'user')
            .where('project.id = :projectId', { projectId: projectId.getValue() })
            .andWhere(
                '(project.ownerId = :userId OR member.userId = :userId)',
                { userId }
            );

        return await queryBuilder.getOne();
    }

    async findById(projectId: ProjectId): Promise<Project | null> {
        return await this.projectRepository.findOne({
            where: { id: projectId.getValue() },
            relations: ['members', 'members.user', 'tasks'],
        });
    }

    async findByUserId(
        userId: string,
        options: {
            page?: number;
            limit?: number;
            search?: string;
            isActive?: boolean;
        } = {}
    ): Promise<{
        projects: Project[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const { page = 1, limit = 10, search, isActive } = options;
        const skip = (page - 1) * limit;

        const queryBuilder = this.createProjectQueryBuilder(userId);

        // Apply filters
        if (search) {
            queryBuilder.andWhere(
                '(project.name ILIKE :search OR project.description ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        if (isActive !== undefined) {
            queryBuilder.andWhere('project.isActive = :isActive', { isActive });
        }

        // Get total count
        const total = await queryBuilder.getCount();

        // Apply pagination and get results with relations
        const projects = await queryBuilder
            .leftJoinAndSelect('project.members', 'projectMember')
            .leftJoinAndSelect('projectMember.user', 'memberUser')
            .leftJoinAndSelect('project.tasks', 'projectTask')
            .skip(skip)
            .take(limit)
            .orderBy('project.updatedAt', 'DESC')
            .getMany();

        const totalPages = Math.ceil(total / limit);

        return {
            projects,
            total,
            page,
            limit,
            totalPages,
        };
    }

    async findAllProjects(
        options: {
            page?: number;
            limit?: number;
            search?: string;
            isActive?: boolean;
        } = {}
    ): Promise<{
        projects: Project[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const { page = 1, limit = 100, search, isActive } = options;
        const skip = (page - 1) * limit;

        const queryBuilder = this.projectRepository.createQueryBuilder('project');

        // Apply filters
        if (search) {
            queryBuilder.andWhere(
                '(project.name ILIKE :search OR project.description ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        if (isActive !== undefined) {
            queryBuilder.andWhere('project.isActive = :isActive', { isActive });
        }

        // Get total count
        const total = await queryBuilder.getCount();

        // Apply pagination and get results with relations
        const projects = await queryBuilder
            .leftJoinAndSelect('project.members', 'projectMember')
            .leftJoinAndSelect('projectMember.user', 'memberUser')
            .leftJoinAndSelect('project.tasks', 'projectTask')
            .skip(skip)
            .take(limit)
            .orderBy('project.updatedAt', 'DESC')
            .getMany();

        const totalPages = Math.ceil(total / limit);

        return {
            projects,
            total,
            page,
            limit,
            totalPages,
        };
    }

    async update(project: Project): Promise<Project> {
        return await this.projectRepository.save(project);
    }

    async delete(projectId: ProjectId): Promise<void> {
        await this.projectRepository.delete(projectId.getValue());
    }

    async existsByNameAndUserId(name: string, userId: string): Promise<boolean> {
        const count = await this.projectRepository
            .createQueryBuilder('project')
            .leftJoin('project.members', 'member')
            .where('project.name = :name', { name })
            .andWhere(
                '(project.ownerId = :userId OR member.userId = :userId)',
                { userId }
            )
            .getCount();

        return count > 0;
    }

    async countMembers(projectId: ProjectId): Promise<number> {
        return await this.projectMemberRepository.count({
            where: { projectId: projectId.getValue() }
        });
    }

    async countTasks(projectId: ProjectId): Promise<number> {
        const count = await this.projectRepository
            .createQueryBuilder('project')
            .leftJoin(Task, 'task', 'task.projectId = project.id')
            .where('project.id = :projectId', { projectId: projectId.toString() })
            .select('COUNT(task.id)', 'taskCount')
            .getRawOne();

        return parseInt(count.taskCount) || 0;
    }

    private createProjectQueryBuilder(userId: string): SelectQueryBuilder<Project> {
        return this.projectRepository
            .createQueryBuilder('project')
            .leftJoin('project.members', 'member')
            .where(
                '(project.ownerId = :userId OR member.userId = :userId)',
                { userId }
            )
            // .groupBy('project.id');
            .distinct(true);
    }
}
