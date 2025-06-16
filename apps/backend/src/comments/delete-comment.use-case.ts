import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';

export interface DeleteCommentCommand {
    commentId: string;
    userId: string;
}

@Injectable()
export class DeleteCommentUseCase {
    constructor(
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
    ) { }

    async execute(command: DeleteCommentCommand): Promise<void> {
        const { commentId, userId } = command;

        // Find comment
        const comment = await this.commentRepository.findOne({
            where: { id: commentId },
            relations: ['replies'],
        });

        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        // Check if user can delete this comment
        if (!comment.canBeDeletedBy(userId)) {
            throw new ForbiddenException('You can only delete your own comments');
        }

        // If comment has replies, mark as deleted instead of hard delete
        if (comment.hasReplies()) {
            comment.markAsDeleted();
            await this.commentRepository.save(comment);
        } else {
            // Hard delete if no replies
            await this.commentRepository.remove(comment);
        }
    }
}
