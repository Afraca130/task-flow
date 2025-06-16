import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';

export interface UpdateCommentCommand {
    commentId: string;
    userId: string;
    content: string;
}

@Injectable()
export class UpdateCommentUseCase {
    constructor(
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
    ) { }

    async execute(command: UpdateCommentCommand): Promise<Comment> {
        const { commentId, userId, content } = command;

        // Find comment
        const comment = await this.commentRepository.findOne({
            where: { id: commentId },
            relations: ['user'],
        });

        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        // Check if user can edit this comment
        if (!comment.canBeEditedBy(userId)) {
            throw new ForbiddenException('You can only edit your own comments');
        }

        // Update comment content
        comment.updateContent(content);

        // Save updated comment
        const updatedComment = await this.commentRepository.save(comment);

        // Return comment with relations
        return await this.commentRepository.findOne({
            where: { id: updatedComment.id },
            relations: ['user', 'parent'],
        });
    }
}
