import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { LexoRank } from '../../common/utils/lexo-rank.util';
import { TimeUtil } from '../../common/utils/time.util';
import { ActivityLogService } from '../activity-logs/activity-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { IProjectService, IUserService } from '../shared/interfaces';
import { CreateTaskDto } from './dto/request/create-task.dto';
import { UpdateTaskDto } from './dto/request/update-task.dto';
import { Task, TaskPriority, TaskStatus } from './entities/task.entity';
import { TaskRepository } from './task.repository';
// UserLog imports removed - using ActivityLogService instead
;

export interface ReorderTaskResult {
    task: Task;
    affectedTasks: Task[];
}

export interface TaskFilters {
    projectId?: string;
    assigneeId?: string;
    status?: TaskStatus;
    search?: string;
    page?: number;
    limit?: number;
}

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(
        private readonly taskRepository: TaskRepository,
        private readonly activityLogService: ActivityLogService,
        private readonly notificationsService: NotificationsService,
        @Inject('IUserService') private readonly usersService: IUserService,
        @Inject('IProjectService') private readonly projectsService: IProjectService,
    ) { }

    /**
     * Find task by ID
     */
    async findById(id: string): Promise<Task | null> {
        return await this.taskRepository.findById(id);
    }

    /**
     * Find tasks by project ID
     */
    async findByProjectId(projectId: string): Promise<Task[]> {
        return await this.taskRepository.findByProjectId(projectId);
    }

    /**
     * Find tasks by project ID and status, ordered by rank
     */
    async findByProjectIdAndStatus(projectId: string, status: TaskStatus): Promise<Task[]> {
        return await this.taskRepository.findByProjectIdAndStatusOrderedByRank(projectId, status);
    }

    /**
     * Create a new task
     */
    async createTask(command: CreateTaskDto, assignerId: string): Promise<Task> {
        this.logger.log(`Creating task: ${command.title}`);

        try {
            // Validate required fields
            if (!command.title?.trim()) {
                throw new BadRequestException('Task title is required');
            }

            if (!command.projectId) {
                throw new BadRequestException('Project ID is required');
            }

            if (!assignerId) {
                throw new BadRequestException('Assigner ID is required');
            }

            // Determine the status for the new task
            const taskStatus = command.status || TaskStatus.TODO;

            // Get existing tasks in the same project and status to determine LexoRank
            const existingTasks = await this.taskRepository.findByProjectIdAndStatusOrderedByRank(
                command.projectId,
                taskStatus
            );

            // Generate appropriate LexoRank for the new task (add at the top)
            let lexoRank: string;
            if (existingTasks.length === 0) {
                // First task in this status
                lexoRank = LexoRank.generateInitialRank();
            } else {
                // Add before the first task (at the top)
                const firstTask = existingTasks[0];
                lexoRank = LexoRank.before(firstTask.lexoRank);
            }

            this.logger.log(`Generated LexoRank for new task (at top): ${lexoRank}`);

            // Create new task object
            const task = new Task();
            task.projectId = command.projectId;
            task.assignerId = assignerId;
            task.title = command.title.trim();
            task.description = command.description?.trim();
            task.assigneeId = command.assigneeId;
            task.status = command.status || TaskStatus.TODO;
            task.priority = (command.priority as TaskPriority) || TaskPriority.MEDIUM;
            task.dueDate = command.dueDate ? TimeUtil.toDate(command.dueDate) : undefined;
            task.tags = command.tags || [];
            task.lexoRank = lexoRank;

            // Save task
            const savedTask = await this.taskRepository.save(task);

            // Log task creation activity
            await this.activityLogService.logTaskCreated(
                assignerId,
                command.projectId,
                savedTask.id,
                savedTask.title,
                command.assigneeId
            );

            // Log assignment if task is assigned to someone else
            if (command.assigneeId && command.assigneeId !== assignerId) {
                await this.activityLogService.logTaskAssigned(
                    assignerId,
                    command.projectId,
                    savedTask.id,
                    savedTask.title,
                    command.assigneeId,
                    'Assignee' // TODO: Get actual user name
                );
            }

            // Notify assignee
            if (command.assigneeId && command.assigneeId !== assignerId) {
                try {
                    this.logger.log(`Preparing to send task assignment notification to: ${command.assigneeId}`);

                    const assigner = await this.usersService.findById(assignerId);
                    const assignerName = assigner?.name || 'Someone';

                    this.logger.log(`Assigner details: ${assignerName} (${assignerId})`);

                    const notification = await this.notificationsService.createTaskAssignmentNotification(
                        command.assigneeId,
                        assignerName,
                        command.title,
                        savedTask.id
                    );

                    this.logger.log(`Task assignment notification created: ${notification.id}`);
                    this.logger.log(`Notification details:`, {
                        id: notification.id,
                        userId: notification.userId,
                        type: notification.type,
                        title: notification.title,
                        message: notification.message
                    });
                } catch (error) {
                    this.logger.error(`Failed to send task assignment notification:`, error.stack || error);
                    // Don't fail the task creation if notification fails
                }
            } else {
                this.logger.log(`No assignee specified, skipping notification`);
            }

            this.logger.log(`Task created successfully: ${savedTask.id}`);
            return savedTask;

        } catch (error) {
            this.logger.error(`Failed to create task: ${command.title}`, error);
            throw error;
        }
    }

    /**
     * Update a task
     */
    async updateTask(taskId: string, userId: string, command: UpdateTaskDto): Promise<Task> {
        this.logger.log(`Updating task: ${taskId}`);

        try {
            // Check permission first
            await this.checkTaskPermission(taskId, userId, 'update');

            // Find existing task
            const existingTask = await this.taskRepository.findById(taskId);
            if (!existingTask) {
                throw new NotFoundException(`Task with id ${taskId} not found`);
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
                existingTask.status = command.status;
                // Set completed date if status is completed
                if (command.status === TaskStatus.COMPLETED && existingTask.status !== TaskStatus.COMPLETED) {
                    existingTask.completedAt = TimeUtil.now();
                } else if (command.status !== TaskStatus.COMPLETED) {
                    existingTask.completedAt = undefined;
                }
            }

            // Update priority
            if (command.priority !== undefined && command.priority !== existingTask.priority) {
                changes.priority = { from: existingTask.priority, to: command.priority };
                existingTask.priority = command.priority;
            }

            // Update assignee
            if (command.assigneeId !== undefined && command.assigneeId !== existingTask.assigneeId) {
                changes.assignee = { from: existingTask.assigneeId, to: command.assigneeId };
                existingTask.assigneeId = command.assigneeId;
            }

            // Save updated task
            const updatedTask = await this.taskRepository.save(existingTask);

            // Log specific activity changes
            if (changes.status) {
                await this.activityLogService.logTaskStatusChanged(
                    userId,
                    updatedTask.projectId,
                    updatedTask.id,
                    updatedTask.title,
                    changes.status.from,
                    changes.status.to
                );
            }

            if (changes.priority) {
                await this.activityLogService.logTaskPriorityChanged(
                    userId,
                    updatedTask.projectId,
                    updatedTask.id,
                    updatedTask.title,
                    changes.priority.from,
                    changes.priority.to
                );
            }

            if (changes.assignee) {
                await this.activityLogService.logTaskAssigned(
                    userId,
                    updatedTask.projectId,
                    updatedTask.id,
                    updatedTask.title,
                    changes.assignee.to,
                    'Assignee' // TODO: Get actual user name
                );
            }

            // Log general update if other changes exist
            if (Object.keys(changes).length > 0 && !changes.status && !changes.priority && !changes.assignee) {
                await this.activityLogService.logTaskUpdated(
                    userId,
                    updatedTask.projectId,
                    updatedTask.id,
                    updatedTask.title,
                    changes
                );
            }

            this.logger.log(`Task updated successfully: ${updatedTask.id}`);
            return updatedTask;

        } catch (error) {
            this.logger.error(`Failed to update task: ${taskId}`, error);
            throw error;
        }
    }

    /**
     * Reorder a task
     */
    async reorderTask(
        taskId: string,
        projectId: string,
        newPosition: number,
        newStatus?: TaskStatus,
        userId?: string
    ): Promise<ReorderTaskResult> {
        this.logger.log(`Reordering task: ${taskId} to position ${newPosition}`);

        try {
            // 1. Find the task to move
            const taskToMove = await this.taskRepository.findById(taskId);
            if (!taskToMove) {
                throw new NotFoundException(`Task with id ${taskId} not found`);
            }

            // 2. Validate project
            if (taskToMove.projectId !== projectId) {
                throw new BadRequestException('Task does not belong to the specified project');
            }

            // 3. Update status if changed
            const targetStatus = newStatus || taskToMove.status;
            const statusChanged = newStatus && newStatus !== taskToMove.status;

            // 4. Get all tasks in target status (ordered by LexoRank)
            const targetTasks = await this.taskRepository.findByProjectIdAndStatusOrderedByRank(
                projectId,
                targetStatus
            );

            // 5. Filter out the task to move (only if status didn't change)
            const filteredTasks = statusChanged
                ? targetTasks
                : targetTasks.filter(task => task.id !== taskId);

            // 6. Calculate new LexoRank
            const existingRanks = filteredTasks.map(task => task.lexoRank);
            const newLexoRank = LexoRank.calculateNewRank(newPosition, existingRanks);

            // 7. Update task
            if (statusChanged) {
                taskToMove.status = targetStatus;
            }
            taskToMove.lexoRank = newLexoRank;

            const updatedTask = await this.taskRepository.save(taskToMove);

            // 8. Handle affected tasks
            const affectedTasks: Task[] = [];

            // Check for LexoRank duplicates and reorder if necessary
            const allTasksInStatus = await this.taskRepository.findByProjectIdAndStatusOrderedByRank(
                projectId,
                targetStatus
            );

            const duplicates = allTasksInStatus.filter(task =>
                task.lexoRank === newLexoRank && task.id !== taskId
            );

            if (duplicates.length > 0) {
                this.logger.warn(`Found ${duplicates.length} tasks with duplicate LexoRank`);
                const reorderedTasks = await this.reorderAllTasks(allTasksInStatus);
                affectedTasks.push(...reorderedTasks);
            }

            // Log activity if userId is provided
            if (userId) {
                await this.activityLogService.logTaskUpdated(
                    userId,
                    updatedTask.projectId,
                    updatedTask.id,
                    updatedTask.title,
                    {
                        reordered: {
                            newPosition,
                            statusChanged: statusChanged ? { from: taskToMove.status, to: targetStatus } : null
                        }
                    }
                );
            }

            this.logger.log(`Task reordered successfully: ${updatedTask.id}`);
            return {
                task: updatedTask,
                affectedTasks
            };

        } catch (error) {
            this.logger.error(`Failed to reorder task: ${taskId}`, error);
            throw error;
        }
    }

    /**
     * Reorder task by lexoRank
     */
    async reorderTaskByLexoRank(taskId: string, newLexoRank: string, userId?: string): Promise<Task> {
        this.logger.log(`Reordering task: ${taskId} with new LexoRank: ${newLexoRank}`);

        try {
            const task = await this.taskRepository.findById(taskId);
            if (!task) {
                throw new NotFoundException(`Task with id ${taskId} not found`);
            }

            const oldLexoRank = task.lexoRank;
            task.lexoRank = newLexoRank;

            const updatedTask = await this.taskRepository.save(task);

            // Log activity if userId is provided
            if (userId) {
                await this.activityLogService.logTaskUpdated(
                    userId,
                    updatedTask.projectId,
                    updatedTask.id,
                    updatedTask.title,
                    {
                        lexoRankChange: { from: oldLexoRank, to: newLexoRank }
                    }
                );
            }

            return updatedTask;

        } catch (error) {
            this.logger.error(`Failed to reorder task by LexoRank: ${taskId}`, error);
            throw error;
        }
    }

    /**
     * Delete a task
     */
    async deleteTask(id: string, userId: string): Promise<void> {
        this.logger.log(`Deleting task: ${id} by user: ${userId}`);

        try {
            // Check permission first
            await this.checkTaskPermission(id, userId, 'delete');

            // Get task details for logging before deletion
            const task = await this.taskRepository.findById(id);
            if (!task) {
                throw new NotFoundException(`Task with id ${id} not found`);
            }

            // Log task deletion activity
            await this.activityLogService.logTaskDeleted(
                userId,
                task.projectId,
                task.id,
                task.title
            );

            // Delete the task
            await this.taskRepository.delete(id);

            this.logger.log(`Task deleted successfully: ${id}`);

        } catch (error) {
            this.logger.error(`Failed to delete task: ${id}`, error);
            throw error;
        }
    }

    /**
     * Find tasks with filters
     */
    async findWithFilters(filters: TaskFilters): Promise<{ tasks: Task[]; total: number }> {
        return await this.taskRepository.findWithFilters(filters);
    }

    /**
     * Get task statistics for a project
     */
    async getTaskStatsByProject(projectId: string): Promise<{
        total: number;
        todo: number;
        inProgress: number;
        completed: number;
    }> {
        this.logger.log(`Getting task statistics for project: ${projectId}`);

        try {
            if (!projectId) {
                throw new BadRequestException('Project ID is required');
            }

            const tasks = await this.findByProjectId(projectId);

            const stats = {
                total: tasks.length,
                todo: tasks.filter(task => task.status === TaskStatus.TODO).length,
                inProgress: tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length,
                completed: tasks.filter(task => task.status === TaskStatus.COMPLETED).length,
            };

            this.logger.log(`Task statistics retrieved for project ${projectId}: ${JSON.stringify(stats)}`);
            return stats;

        } catch (error) {
            this.logger.error(`Failed to get task statistics for project: ${projectId}`, error.stack || error);
            throw error;
        }
    }

    /**
     * Reorder all tasks in a status (resolve LexoRank duplicates)
     */
    private async reorderAllTasks(tasks: Task[]): Promise<Task[]> {
        const reorderedTasks: Task[] = [];

        // Maintain current order while assigning new LexoRanks
        const tasksWithNewRanks = LexoRank.initializeRanks(tasks.length);

        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            const newRank = tasksWithNewRanks[i];

            if (task.lexoRank !== newRank) {
                task.lexoRank = newRank;
                const updatedTask = await this.taskRepository.save(task);
                reorderedTasks.push(updatedTask);
            }
        }

        return reorderedTasks;
    }

    /**
     * Check if user has permission to modify/delete a task
     * - 소유주와 매니저는 모든 태스크 수정/삭제 가능
     * - 멤버는 자신이 assigner(생성자)인 태스크만 수정/삭제 가능
     */
    private async checkTaskPermission(taskId: string, userId: string, action: 'update' | 'delete'): Promise<void> {
        this.logger.log(`Checking ${action} permission for task: ${taskId}, user: ${userId}`);

        try {
            // Find the task
            const task = await this.taskRepository.findById(taskId);
            if (!task) {
                throw new NotFoundException(`Task with id ${taskId} not found`);
            }

            // Get project members to check user role
            const projectMembers = await this.projectsService.getProjectMembers(task.projectId, userId);
            const userMember = projectMembers.find(member => member.userId === userId);

            if (!userMember) {
                throw new ForbiddenException('You do not have access to this project');
            }

            // Check permissions based on role
            const userRole = userMember.role;

            // 소유주와 매니저는 모든 태스크 수정/삭제 가능
            if (userRole === 'OWNER' || userRole === 'MANAGER') {
                this.logger.log(`User has ${userRole} role, ${action} allowed`);
                return;
            }

            // 멤버는 자신이 assigner(생성자)인 태스크만 수정/삭제 가능
            if (userRole === 'MEMBER') {
                if (task.assignerId === userId) {
                    this.logger.log(`User is the assigner of the task, ${action} allowed`);
                    return;
                }
                throw new ForbiddenException(`Members can only ${action} tasks they created`);
            }

            throw new ForbiddenException(`Invalid role: ${userRole}`);

        } catch (error) {
            this.logger.error(`Permission check failed for ${action} task: ${taskId}`, error);
            throw error;
        }
    }
}
