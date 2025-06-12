import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../../domain/entities/comment.entity';
import { Task } from '../../../domain/entities/task.entity';
import { User } from '../../../domain/entities/user.entity';

export interface CreateCommentCommand {
    taskId: string;
    userId: string;
    content: string;
    parentId?: string;
}

@Injectable()
export class CreateCommentUseCase {
    constructor(
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async execute(command: CreateCommentCommand): Promise<Comment> {
        const { taskId, userId, content, parentId } = command;

        // Validate task exists
        const task = await this.taskRepository.findOne({ where: { id: taskId } });
        if (!task) {
            throw new NotFoundException('Task not found');
        }

        // Validate user exists
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Validate parent comment if provided
        let parentComment: Comment | null = null;
        if (parentId) {
            parentComment = await this.commentRepository.findOne({
                where: { id: parentId, taskId },
            });
            if (!parentComment) {
                throw new BadRequestException('Parent comment not found or does not belong to this task');
            }
        }

        // Create comment
        const comment = this.commentRepository.create({
            taskId,
            userId,
            content,
            parentId,
            isDeleted: false,
        });

        const savedComment = await this.commentRepository.save(comment);

        // Return comment with relations
        return await this.commentRepository.findOne({
            where: { id: savedComment.id },
            relations: ['user', 'parent'],
        });
    }
}
