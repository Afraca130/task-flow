import { TaskRepositoryPort } from '@/tasks/interfaces';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';


export interface GetTaskCommentsQuery {
    taskId: string;
}

@Injectable()
export class GetTaskCommentsUseCase {
    constructor(
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
        @Inject('TaskRepositoryPort')
        private readonly taskRepository: TaskRepositoryPort,
    ) { }

    async execute(query: GetTaskCommentsQuery): Promise<Comment[]> {
        const { taskId } = query;

        try {
            // Task 존재 여부 확인 (선택적)
            const task = await this.taskRepository.findById(taskId);
            if (!task) {
                console.warn(`Task with id ${taskId} not found, returning empty comments`);
                return [];
            }

            // Get all comments for the task with nested replies
            const comments = await this.commentRepository.find({
                where: { taskId, isDeleted: false },
                relations: ['user', 'parent', 'replies', 'replies.user'],
                order: { createdAt: 'ASC' },
            });

            // Return only top-level comments (replies are included via relations)
            return comments.filter(comment => !comment.parentId);
        } catch (error) {
            console.warn(`Failed to load comments for task ${taskId}:`, error.message);
            return [];
        }
    }
}
