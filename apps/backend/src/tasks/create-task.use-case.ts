import { UserActionType } from '@/users/entities/user-log.entity';
import { UserLogService } from '@/users/user-log.service';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { LexoRank } from '../common/utils/lexo-rank.util';
import { Task, TaskStatus } from './entities/task.entity';
import { TaskRepositoryPort } from './interfaces/task-repository.port';


export interface CreateTaskCommand {
    title: string;
    description?: string;
    projectId: string;
    assigneeId?: string;
    assignerId: string;
    status?: TaskStatus;
    priority?: string;
    dueDate?: Date;
    estimatedHours?: number;
    tags?: string[];
}

export interface CreateTaskPort {
    execute(command: CreateTaskCommand): Promise<Task>;
}

@Injectable()
export class CreateTaskUseCase implements CreateTaskPort {
    private readonly logger = new Logger(CreateTaskUseCase.name);

    constructor(
        @Inject('TaskRepositoryPort')
        private readonly taskRepository: TaskRepositoryPort,
        private readonly userLogService: UserLogService,
    ) { }

    async execute(command: CreateTaskCommand): Promise<Task> {
        this.logger.log(`Creating task: ${command.title}`);

        try {
            // Validate required fields
            if (!command.title?.trim()) {
                throw new BadRequestException('Task title is required');
            }

            if (!command.projectId) {
                throw new BadRequestException('Project ID is required');
            }

            if (!command.assignerId) {
                throw new BadRequestException('Assigner ID is required');
            }

            // Determine the status for the new task
            const taskStatus = command.status || TaskStatus.TODO;

            // Get existing tasks in the same project and status to determine LexoRank
            const existingTasks = await this.taskRepository.findByProjectIdAndStatusOrderedByRank(
                command.projectId,
                taskStatus
            );

            // Generate appropriate LexoRank for the new task (add at the end)
            let lexoRank: string;
            if (existingTasks.length === 0) {
                // First task in this status
                lexoRank = LexoRank.generateInitialRank();
            } else {
                // Add after the last task
                const lastTask = existingTasks[existingTasks.length - 1];
                lexoRank = LexoRank.generateAfter(lastTask.lexoRank);
            }

            this.logger.log(`Generated LexoRank for new task: ${lexoRank}`);

            // Create task using domain factory method
            const task = Task.create(
                command.projectId,
                command.assignerId,
                command.title,
                command.description,
                command.assigneeId,
                lexoRank
            );

            // Set status if provided
            if (command.status) {
                task.updateStatus(command.status);
            }

            // Set additional properties
            if (command.priority) {
                task.updatePriority(command.priority as any);
            }

            if (command.dueDate) {
                task.setDueDate(command.dueDate);
            }

            if (command.estimatedHours) {
                task.updateEstimatedHours(command.estimatedHours);
            }

            if (command.tags && command.tags.length > 0) {
                command.tags.forEach(tag => task.addTag(tag));
            }

            // Save task
            const savedTask = await this.taskRepository.save(task);

            // Log activity
            await this.userLogService.logUserActivity({
                userId: command.assignerId,
                actionType: UserActionType.TASK_CREATE,
                description: `새 작업 생성: ${savedTask.title}`,
                resourceId: savedTask.id,
                resourceType: 'task',
                details: {
                    taskTitle: savedTask.title,
                    projectId: savedTask.projectId
                }
            });

            // Log assignment if task is assigned to someone
            if (command.assigneeId && command.assigneeId !== command.assignerId) {
                await this.userLogService.logUserActivity({
                    userId: command.assigneeId,
                    actionType: UserActionType.TASK_CREATE,
                    description: `작업이 할당됨: ${savedTask.title}`,
                    resourceId: savedTask.id,
                    resourceType: 'task',
                    details: {
                        taskTitle: savedTask.title,
                        assignedBy: command.assignerId,
                        projectId: savedTask.projectId
                    }
                });
            }

            this.logger.log(`Task created successfully: ${savedTask.id}`);
            return savedTask;

        } catch (error) {
            this.logger.error(`Failed to create task: ${command.title}`, error);

            // Log error
            await this.userLogService.logError(
                error instanceof Error ? error : new Error(String(error)),
                'CreateTaskUseCase',
                command.assignerId,
                undefined,
                {
                    taskTitle: command.title,
                    projectId: command.projectId
                }
            );

            throw error;
        }
    }
}
