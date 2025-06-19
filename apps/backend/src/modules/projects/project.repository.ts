import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ProjectMember } from './entities/project-member.entity';
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
        return await this.projectRepository.save(project);
    }

    async findById(projectId: string): Promise<Project | null> {
        return await this.projectRepository.findOne({
            where: { id: projectId },
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

        // 공개 프로젝트만 필터링
        queryBuilder.where('project.isPublic = :isPublic', { isPublic: true });

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

    async update(projectId: string, updateData: Partial<Project>): Promise<Project> {
        await this.projectRepository.update(projectId, updateData);
        const updatedProject = await this.findById(projectId);
        if (!updatedProject) {
            throw new Error(`Project with id ${projectId} not found after update`);
        }
        return updatedProject;
    }

    async delete(projectId: string): Promise<void> {
        await this.projectRepository.delete(projectId);
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

    async countMembers(projectId: string): Promise<number> {
        return await this.projectMemberRepository.count({
            where: { projectId }
        });
    }

    async countTasks(projectId: string): Promise<number> {
        const count = await this.projectRepository
            .createQueryBuilder('project')
            .leftJoin('project.tasks', 'task')
            .where('project.id = :projectId', { projectId })
            .getCount();

        return count;
    }

    private createProjectQueryBuilder(userId: string): SelectQueryBuilder<Project> {
        return this.projectRepository
            .createQueryBuilder('project')
            .leftJoin('project.members', 'member')
            .where(
                '(project.ownerId = :userId OR member.userId = :userId)',
                { userId }
            );
    }
}
