import { CreateTaskDto, ReorderTaskDto, UpdateTaskDto } from '../dto/request';
import { Task, TaskPriority, TaskStatus } from '../entities/task.entity';

export interface TaskServiceInterface {
    createTask(userId: string, createDto: CreateTaskDto): Promise<Task>;
    updateTask(userId: string, taskId: string, updateDto: UpdateTaskDto): Promise<Task>;
    deleteTask(userId: string, taskId: string): Promise<void>;
    getTaskById(taskId: string): Promise<Task | null>;
    getTasksByProject(projectId: string): Promise<Task[]>;
    getTasksByAssignee(assigneeId: string): Promise<Task[]>;
    getTasksByStatus(projectId: string, status: TaskStatus): Promise<Task[]>;
    getTasksByPriority(projectId: string, priority: TaskPriority): Promise<Task[]>;
    reorderTasks(userId: string, reorderDto: ReorderTaskDto): Promise<void>;
    assignTask(userId: string, taskId: string, assigneeId: string): Promise<Task>;
    unassignTask(userId: string, taskId: string): Promise<Task>;
    markTaskAsCompleted(userId: string, taskId: string): Promise<Task>;
    markTaskAsInProgress(userId: string, taskId: string): Promise<Task>;
    searchTasks(query: string, projectId?: string): Promise<Task[]>;
}
