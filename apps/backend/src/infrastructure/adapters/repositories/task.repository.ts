import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskRepositoryPort } from '../../../application/ports/output/task-repository.port';
import { Task, TaskStatus } from '../../../domain/entities/task.entity';

@Injectable()
export class TaskRepository implements TaskRepositoryPort {
    private readonly logger = new Logger(TaskRepository.name);

    constructor(
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
    ) { }

    async findById(id: string): Promise<Task | null> {
        try {
            return await this.taskRepository.findOne({
                where: { id },
                relations: ['assignee', 'assigner', 'project', 'comments'],
            });
        } catch (error) {
            this.logger.error(`Failed to find task by id: ${id}`, error);
            return null;
        }
    }

    async findByProjectId(projectId: string): Promise<Task[]> {
        try {
            return await this.taskRepository.find({
                where: { projectId },
                relations: ['assignee', 'assigner', 'project'],
                order: { createdAt: 'DESC' },
            });
        } catch (error) {
            this.logger.error(`Failed to find tasks by project id: ${projectId}`, error);
            return [];
        }
    }

    async findByProjectIdOrderedByRank(projectId: string): Promise<Task[]> {
        try {
            return await this.taskRepository.find({
                where: { projectId },
                relations: ['assignee', 'assigner', 'project'],
                order: { lexoRank: 'ASC' },
            });
        } catch (error) {
            this.logger.error(`Failed to find tasks by project id ordered by rank: ${projectId}`, error);
            return [];
        }
    }

    async findByAssigneeId(assigneeId: string): Promise<Task[]> {
        try {
            return await this.taskRepository.find({
                where: { assigneeId },
                relations: ['assignee', 'assigner', 'project'],
                order: { createdAt: 'DESC' },
            });
        } catch (error) {
            this.logger.error(`Failed to find tasks by assignee id: ${assigneeId}`, error);
            return [];
        }
    }

    async findByStatus(status: TaskStatus): Promise<Task[]> {
        try {
            return await this.taskRepository.find({
                where: { status },
                relations: ['assignee', 'assigner', 'project'],
                order: { createdAt: 'DESC' },
            });
        } catch (error) {
            this.logger.error(`Failed to find tasks by status: ${status}`, error);
            return [];
        }
    }

    async findByProjectIdAndStatus(projectId: string, status: TaskStatus): Promise<Task[]> {
        try {
            return await this.taskRepository.find({
                where: { projectId, status },
                relations: ['assignee', 'assigner', 'project'],
                order: { createdAt: 'DESC' },
            });
        } catch (error) {
            this.logger.error(`Failed to find tasks by project ${projectId} and status ${status}`, error);
            return [];
        }
    }

    async findByProjectIdAndStatusOrderedByRank(projectId: string, status: TaskStatus): Promise<Task[]> {
        try {
            return await this.taskRepository.find({
                where: { projectId, status },
                relations: ['assignee', 'assigner', 'project'],
                order: { lexoRank: 'ASC' },
            });
        } catch (error) {
            this.logger.error(`Failed to find tasks by project ${projectId} and status ${status} ordered by rank`, error);
            return [];
        }
    }

    async save(task: Task): Promise<Task> {
        try {
            const savedTask = await this.taskRepository.save(task);
            return await this.findById(savedTask.id) || savedTask;
        } catch (error) {
            this.logger.error('Failed to save task', error);
            throw error;
        }
    }

    async update(id: string, updates: Partial<Task>): Promise<Task> {
        try {
            await this.taskRepository.update(id, updates);
            const updatedTask = await this.findById(id);
            if (!updatedTask) {
                throw new Error(`Task with id ${id} not found after update`);
            }
            return updatedTask;
        } catch (error) {
            this.logger.error(`Failed to update task: ${id}`, error);
            throw error;
        }
    }

    async updateRank(id: string, lexoRank: string): Promise<Task> {
        try {
            await this.taskRepository.update(id, { lexoRank });
            const updatedTask = await this.findById(id);
            if (!updatedTask) {
                throw new Error(`Task with id ${id} not found after rank update`);
            }
            return updatedTask;
        } catch (error) {
            this.logger.error(`Failed to update task rank: ${id}`, error);
            throw error;
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await this.taskRepository.delete(id);
        } catch (error) {
            this.logger.error(`Failed to delete task: ${id}`, error);
            throw error;
        }
    }

    async findAll(): Promise<Task[]> {
        try {
            return await this.taskRepository.find({
                relations: ['assignee', 'assigner', 'project'],
                order: { createdAt: 'DESC' },
            });
        } catch (error) {
            this.logger.error('Failed to find all tasks', error);
            return [];
        }
    }

    async findWithFilters(filters: {
        projectId?: string;
        assigneeId?: string;
        status?: TaskStatus;
        search?: string;
        page?: number;
        limit?: number;
        lexoRank?: string;
    }): Promise<{ tasks: Task[]; total: number }> {
        try {
            const queryBuilder = this.taskRepository.createQueryBuilder('task')
                .leftJoinAndSelect('task.assignee', 'assignee')
                .leftJoinAndSelect('task.assigner', 'assigner')
                .leftJoinAndSelect('task.project', 'project');

            // Apply filters
            if (filters.projectId) {
                queryBuilder.andWhere('task.projectId = :projectId', { projectId: filters.projectId });
            }

            if (filters.assigneeId) {
                queryBuilder.andWhere('task.assigneeId = :assigneeId', { assigneeId: filters.assigneeId });
            }

            if (filters.status) {
                queryBuilder.andWhere('task.status = :status', { status: filters.status });
            }

            if (filters.search) {
                queryBuilder.andWhere(
                    '(task.title ILIKE :search OR task.description ILIKE :search)',
                    { search: `%${filters.search}%` }
                );
            }

            // Count total
            const total = await queryBuilder.getCount();

            // Apply pagination
            if (filters.page && filters.limit) {
                const offset = (filters.page - 1) * filters.limit;
                queryBuilder.skip(offset).take(filters.limit);
            }

            // Order by creation date
            queryBuilder.orderBy('task.lexoRank', 'DESC');

            const tasks = await queryBuilder.getMany();

            return { tasks, total };
        } catch (error) {
            this.logger.error('Failed to find tasks with filters', error);
            return { tasks: [], total: 0 };
        }
    }
}
