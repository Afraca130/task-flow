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
        return await this.repository.find({
            where: { taskId },
            relations: ['user'],
            order: { createdAt: 'ASC' }
        });
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
}
