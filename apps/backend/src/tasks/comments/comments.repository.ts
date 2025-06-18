import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentsRepository {
    constructor(
        @InjectRepository(Comment)
        private readonly repository: Repository<Comment>,
    ) { }

    async save(comment: Comment): Promise<Comment> {
        return await this.repository.save(comment);
    }

    async findById(id: string): Promise<Comment | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ['user', 'task']
        });
    }

    async findByTaskId(taskId: string): Promise<Comment[]> {
        // Get all comments for the task with user relation
        const allComments = await this.repository.find({
            where: { taskId },
            relations: ['user'],
            order: { createdAt: 'ASC' }
        });

        // Organize comments into parent-child structure
        const commentMap = new Map<string, Comment>();
        const rootComments: Comment[] = [];

        // First pass: create map and identify root comments
        for (const comment of allComments) {
            commentMap.set(comment.id, comment);
            comment.replies = [];

            if (!comment.parentId) {
                rootComments.push(comment);
            }
        }

        // Second pass: attach replies to their parents
        for (const comment of allComments) {
            if (comment.parentId) {
                const parent = commentMap.get(comment.parentId);
                if (parent) {
                    if (!parent.replies) {
                        parent.replies = [];
                    }
                    parent.replies.push(comment);
                }
            }
        }

        return rootComments;
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async findReplies(parentId: string): Promise<Comment[]> {
        return await this.repository.find({
            where: { parentId },
            relations: ['user'],
            order: { createdAt: 'ASC' }
        });
    }
}
