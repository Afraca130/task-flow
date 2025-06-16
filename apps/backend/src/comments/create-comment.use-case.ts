import { TaskRepositoryPort } from '@/tasks/interfaces';
import { UserRepositoryPort } from '@/users/interfaces';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';


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
        @Inject('TaskRepositoryPort')
        private readonly taskRepository: TaskRepositoryPort,
        @Inject('UserRepositoryPort')
        private readonly userRepository: UserRepositoryPort,
    ) { }

    async execute(command: CreateCommentCommand): Promise<Comment> {
        const { taskId, userId, content, parentId } = command;

        // Validate task exists
        const task = await this.taskRepository.findById(taskId);
        if (!task) {
            throw new NotFoundException('Task not found');
        }

        // Validate user exists
        const user = await this.userRepository.findById(userId);
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
