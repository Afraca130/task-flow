import { Task } from '../../tasks/entities/task.entity';

export interface ITaskService {
    findById(id: string): Promise<Task | null>;
    findByProjectId(projectId: string): Promise<Task[]>;
    deleteTask(id: string, userId?: string): Promise<void>;
}
