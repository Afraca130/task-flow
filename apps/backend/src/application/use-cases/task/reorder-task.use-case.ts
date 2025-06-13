import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Task, TaskStatus } from '../../../domain/entities/task.entity';
import { LexoRankUtil } from '../../../shared/utils/lexorank.util';
import { TaskRepositoryPort } from '../../ports/output/task-repository.port';

export interface ReorderTaskCommand {
    taskId: string;
    projectId: string;
    newStatus?: TaskStatus;
    newPosition: number;
    userId: string;
}

export interface ReorderTaskResult {
    task: Task;
    affectedTasks: Task[];
}

export interface ReorderTaskPort {
    execute(command: ReorderTaskCommand): Promise<ReorderTaskResult>;
}

@Injectable()
export class ReorderTaskUseCase implements ReorderTaskPort {
    private readonly logger = new Logger(ReorderTaskUseCase.name);

    constructor(
        @Inject('TaskRepositoryPort')
        private readonly taskRepository: TaskRepositoryPort,
    ) { }

    async execute(command: ReorderTaskCommand): Promise<ReorderTaskResult> {
        this.logger.log(`Reordering task: ${command.taskId} to position ${command.newPosition}`);

        try {
            // 1. 이동할 task 찾기
            const taskToMove = await this.taskRepository.findById(command.taskId);
            if (!taskToMove) {
                throw new NotFoundException(`Task with id ${command.taskId} not found`);
            }

            // 2. 프로젝트 검증
            if (taskToMove.projectId !== command.projectId) {
                throw new BadRequestException('Task does not belong to the specified project');
            }

            // 3. 상태 변경이 있는 경우 업데이트
            const targetStatus = command.newStatus || taskToMove.status;
            const statusChanged = command.newStatus && command.newStatus !== taskToMove.status;

            // 4. 대상 상태의 모든 태스크 가져오기 (LexoRank 순서로 정렬)
            const targetTasks = await this.taskRepository.findByProjectIdAndStatusOrderedByRank(
                command.projectId,
                targetStatus
            );

            // 5. 이동할 태스크를 제외한 배열 생성 (상태가 바뀌지 않은 경우에만)
            const filteredTasks = statusChanged
                ? targetTasks
                : targetTasks.filter(task => task.id !== command.taskId);

            // 6. 새로운 LexoRank 계산
            const newLexoRank = LexoRankUtil.calculateNewRank(
                filteredTasks.map(task => ({ id: task.id, lexoRank: task.lexoRank })),
                command.taskId,
                command.newPosition
            );
            // 7. 태스크 업데이트
            if (statusChanged) {
                taskToMove.updateStatus(targetStatus);
            }
            taskToMove.lexoRank = newLexoRank;

            const updatedTask = await this.taskRepository.save(taskToMove);

            // 8. 영향받은 다른 태스크들 (필요시 LexoRank 재조정)
            const affectedTasks: Task[] = [];

            // LexoRank가 중복되거나 충돌하는 경우 처리
            const allTasksInStatus = await this.taskRepository.findByProjectIdAndStatusOrderedByRank(
                command.projectId,
                targetStatus
            );

            // 중복 체크 및 재정렬
            const duplicates = allTasksInStatus.filter(task =>
                task.lexoRank === newLexoRank && task.id !== command.taskId
            );

            if (duplicates.length > 0) {
                this.logger.warn(`Found ${duplicates.length} tasks with duplicate LexoRank`);
                // 전체 태스크 재정렬
                const reorderedTasks = await this.reorderAllTasks(allTasksInStatus);
                affectedTasks.push(...reorderedTasks);
            }

            this.logger.log(`Task reordered successfully: ${updatedTask.id}`);
            return {
                task: updatedTask,
                affectedTasks
            };

        } catch (error) {
            this.logger.error(`Failed to reorder task: ${command.taskId}`, error);
            throw error;
        }
    }

    /**
     * 전체 태스크 재정렬 (LexoRank 중복 해결)
     */
    private async reorderAllTasks(tasks: Task[]): Promise<Task[]> {
        const reorderedTasks: Task[] = [];

        // 현재 순서 유지하면서 새로운 LexoRank 할당
        const tasksWithNewRanks = LexoRankUtil.initializeRanks(
            tasks.map(task => ({ id: task.id }))
        );

        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            const newRank = tasksWithNewRanks[i].lexoRank;

            if (task.lexoRank !== newRank) {
                task.lexoRank = newRank;
                const updatedTask = await this.taskRepository.save(task);
                reorderedTasks.push(updatedTask);
            }
        }

        return reorderedTasks;
    }
}
