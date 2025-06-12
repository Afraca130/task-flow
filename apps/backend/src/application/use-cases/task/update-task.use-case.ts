import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Task, TaskPriority, TaskStatus } from '../../../domain/entities/task.entity';
import { UserActionType } from '../../../domain/entities/user-log.entity';
import { TaskRepositoryPort } from '../../ports/output/task-repository.port';
import { UserLogService } from '../../services/user-log.service';

export interface UpdateTaskCommand {
    taskId: string;
    userId: string;
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    dueDate?: Date;
    estimatedHours?: number;
    actualHours?: number;
    tags?: string[];
    projectId?: string;
}

export interface UpdateTaskPort {
    execute(command: UpdateTaskCommand): Promise<Task>;
}

@Injectable()
export class UpdateTaskUseCase implements UpdateTaskPort {
    private readonly logger = new Logger(UpdateTaskUseCase.name);

    constructor(
        @Inject('TaskRepositoryPort')
        private readonly taskRepository: TaskRepositoryPort,
        private readonly userLogService: UserLogService,
    ) { }

    async execute(command: UpdateTaskCommand): Promise<Task> {
        this.logger.log(`Updating task: ${command.taskId}`);

        try {
            // Find existing task
            const existingTask = await this.taskRepository.findById(command.taskId);
            if (!existingTask) {
                throw new NotFoundException(`Task with id ${command.taskId} not found`);
            }

            // Track changes for logging
            const changes: Record<string, { from: any; to: any }> = {};

            // Update title
            if (command.title !== undefined && command.title !== existingTask.title) {
                changes.title = { from: existingTask.title, to: command.title };
                existingTask.title = command.title;
            }

            // Update description
            if (command.description !== undefined && command.description !== existingTask.description) {
                changes.description = { from: existingTask.description, to: command.description };
                existingTask.description = command.description;
            }

            // Update status
            if (command.status !== undefined && command.status !== existingTask.status) {
                changes.status = { from: existingTask.status, to: command.status };
                existingTask.updateStatus(command.status);
            }

            // Update priority
            if (command.priority !== undefined && command.priority !== existingTask.priority) {
                changes.priority = { from: existingTask.priority, to: command.priority };
                existingTask.updatePriority(command.priority);
            }

            // Update assignee
            if (command.assigneeId !== undefined && command.assigneeId !== existingTask.assigneeId) {
                changes.assignee = { from: existingTask.assigneeId, to: command.assigneeId };
                if (command.assigneeId) {
                    existingTask.assignTo(command.assigneeId);
                } else {
                    existingTask.unassign();
                }
            }

            // Update due date
            if (command.dueDate !== undefined) {
                const existingDueDate = existingTask.dueDate?.toISOString();
                const newDueDate = command.dueDate?.toISOString();
                if (existingDueDate !== newDueDate) {
                    changes.dueDate = { from: existingTask.dueDate, to: command.dueDate };
                    if (command.dueDate) {
                        existingTask.setDueDate(command.dueDate);
                    } else {
                        existingTask.removeDueDate();
                    }
                }
            }

            // Update estimated hours
            if (command.estimatedHours !== undefined && command.estimatedHours !== existingTask.estimatedHours) {
                changes.estimatedHours = { from: existingTask.estimatedHours, to: command.estimatedHours };
                existingTask.updateEstimatedHours(command.estimatedHours);
            }

            // Update actual hours
            if (command.actualHours !== undefined && command.actualHours !== existingTask.actualHours) {
                changes.actualHours = { from: existingTask.actualHours, to: command.actualHours };
                existingTask.updateActualHours(command.actualHours);
            }

            // Project ID validation (if provided)
            if (command.projectId !== undefined && command.projectId !== existingTask.projectId) {
                // Note: We don't actually change the project ID of an existing task
                // This is just for validation purposes to ensure the request is for the correct project
                this.logger.warn(`Task ${command.taskId} belongs to project ${existingTask.projectId}, not ${command.projectId}`);
            }

            // Update tags
            if (command.tags !== undefined) {
                const existingTags = existingTask.tags || [];
                const newTags = command.tags;
                if (JSON.stringify(existingTags.sort()) !== JSON.stringify(newTags.sort())) {
                    changes.tags = { from: existingTags, to: newTags };
                    existingTask.tags = newTags;
                }
            }

            // Save changes if any
            if (Object.keys(changes).length === 0) {
                this.logger.log(`No changes detected for task: ${command.taskId}`);
                return existingTask;
            }

            const updatedTask = await this.taskRepository.save(existingTask);

            // Log activity
            await this.userLogService.logUserActivity({
                userId: command.userId,
                actionType: UserActionType.TASK_UPDATE,
                description: `작업 수정: ${updatedTask.title}`,
                resourceId: updatedTask.id,
                resourceType: 'task',
                details: {
                    taskTitle: updatedTask.title,
                    projectId: updatedTask.projectId,
                    changes
                }
            });

            // Log specific status change
            if (changes.status) {
                let statusDescription = '';
                switch (command.status) {
                    case TaskStatus.COMPLETED:
                        statusDescription = '작업 완료';
                        break;
                    case TaskStatus.IN_PROGRESS:
                        statusDescription = '작업 진행 중으로 변경';
                        break;
                    case TaskStatus.TODO:
                        statusDescription = '작업 대기 중으로 변경';
                        break;
                }

                if (statusDescription) {
                    await this.userLogService.logUserActivity({
                        userId: command.userId,
                        actionType: UserActionType.TASK_UPDATE,
                        description: `${statusDescription}: ${updatedTask.title}`,
                        resourceId: updatedTask.id,
                        resourceType: 'task',
                        details: {
                            taskTitle: updatedTask.title,
                            statusChange: changes.status
                        }
                    });
                }
            }

            // Log assignment change
            if (changes.assignee && command.assigneeId) {
                await this.userLogService.logUserActivity({
                    userId: command.assigneeId,
                    actionType: UserActionType.TASK_UPDATE,
                    description: `작업이 재할당됨: ${updatedTask.title}`,
                    resourceId: updatedTask.id,
                    resourceType: 'task',
                    details: {
                        taskTitle: updatedTask.title,
                        reassignedBy: command.userId,
                        previousAssignee: changes.assignee.from
                    }
                });
            }

            this.logger.log(`Task updated successfully: ${updatedTask.id}`);
            return updatedTask;

        } catch (error) {
            this.logger.error(`Failed to update task: ${command.taskId}`, error);

            // Log error
            await this.userLogService.logError(
                error instanceof Error ? error : new Error(String(error)),
                'UpdateTaskUseCase',
                command.userId,
                undefined,
                {
                    taskId: command.taskId
                }
            );

            throw error;
        }
    }
}
