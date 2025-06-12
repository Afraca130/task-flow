import { Task, TaskStatus } from '../../../domain/entities/task.entity';

export interface TaskRepositoryPort {
    findById(id: string): Promise<Task | null>;
    findByProjectId(projectId: string): Promise<Task[]>;
    findByProjectIdOrderedByRank(projectId: string): Promise<Task[]>;
    findByAssigneeId(assigneeId: string): Promise<Task[]>;
    findByStatus(status: TaskStatus): Promise<Task[]>;
    findByProjectIdAndStatus(projectId: string, status: TaskStatus): Promise<Task[]>;
    findByProjectIdAndStatusOrderedByRank(projectId: string, status: TaskStatus): Promise<Task[]>;
    save(task: Task): Promise<Task>;
    update(id: string, updates: Partial<Task>): Promise<Task>;
    updateRank(id: string, lexoRank: string): Promise<Task>;
    delete(id: string): Promise<void>;
    findAll(): Promise<Task[]>;
    findWithFilters(filters: {
        projectId?: string;
        assigneeId?: string;
        status?: TaskStatus;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{ tasks: Task[]; total: number }>;
}
