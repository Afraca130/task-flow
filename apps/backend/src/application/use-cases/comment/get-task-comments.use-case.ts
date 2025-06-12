import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../../domain/entities/comment.entity';
import { Task } from '../../../domain/entities/task.entity';

export interface GetTaskCommentsQuery {
    taskId: string;
}

@Injectable()
export class GetTaskCommentsUseCase {
    constructor(
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
    ) { }

    async execute(query: GetTaskCommentsQuery): Promise<Comment[]> {
        const { taskId } = query;

        // Validate task exists
        const task = await this.taskRepository.findOne({ where: { id: taskId } });
        if (!task) {
            throw new NotFoundException('Task not found');
        }

        // Get all comments for the task with nested replies
        const comments = await this.commentRepository.find({
            where: { taskId, isDeleted: false },
            relations: ['user', 'parent', 'replies', 'replies.user'],
            order: { createdAt: 'ASC' },
        });

        // Return only top-level comments (replies are included via relations)
        return comments.filter(comment => !comment.parentId);
    }
}
