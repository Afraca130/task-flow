import { Task, TaskStatus } from '../entities/task.entity';

/**
 * 작업 리포지토리 포트
 */
export interface TaskRepositoryPort {
    /**
     * 작업 저장
     */
    save(task: Task): Promise<Task>;

    /**
     * ID로 작업 조회
     */
    findById(id: string): Promise<Task | null>;

    /**
     * 프로젝트별 작업 목록 조회
     */
    findByProjectId(projectId: string): Promise<Task[]>;

    /**
     * 프로젝트별 작업 목록 조회 (순서대로)
     */
    findByProjectIdOrderedByRank(projectId: string): Promise<Task[]>;

    /**
     * 프로젝트와 상태별 작업 목록 조회 (순서대로)
     */
    findByProjectIdAndStatusOrderedByRank(projectId: string, status: TaskStatus): Promise<Task[]>;

    /**
     * 프로젝트와 상태별 작업 목록 조회
     */
    findByProjectIdAndStatus(projectId: string, status: TaskStatus): Promise<Task[]>;

    /**
     * 담당자별 작업 목록 조회
     */
    findByAssigneeId(assigneeId: string): Promise<Task[]>;

    /**
     * 상태별 작업 목록 조회
     */
    findByStatus(status: TaskStatus): Promise<Task[]>;

    /**
     * 특정 상태의 작업들을 순서대로 조회
     */
    // findByStatusOrderedByRank(status: TaskStatus): Promise<Task[]>;

    /**
     * 모든 작업 조회
     */
    findAll(): Promise<Task[]>;

    /**
     * 필터로 작업 조회
     */
    findWithFilters(filters: {
        projectId?: string;
        assigneeId?: string;
        status?: TaskStatus;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{ tasks: Task[]; total: number }>;

    /**
     * 작업 업데이트
     */
    update(id: string, updates: Partial<Task>): Promise<Task>;

    /**
     * 순서 업데이트
     */
    updateRank(id: string, lexoRank: string): Promise<Task>;

    /**
     * 여러 작업을 한 번에 업데이트 (순서 변경 시 사용)
     */
    // updateMany(tasks: Task[]): Promise<Task[]>;

    /**
     * 작업 삭제
     */
    delete(id: string): Promise<void>;

    /**
     * 프로젝트의 모든 작업 삭제
     */
    // deleteByProjectId(projectId: string): Promise<void>;

    /**
     * 작업 존재 여부 확인
     */
    // exists(id: string): Promise<boolean>;
}
