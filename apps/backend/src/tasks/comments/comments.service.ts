import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CommentsRepository } from './comments.repository';
import { CreateCommentDto, UpdateCommentDto } from './dto/request';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentsService {
    private readonly logger = new Logger(CommentsService.name);

    constructor(
        private readonly commentsRepository: CommentsRepository,
    ) { }

    /**
     * Create comment use-case moved to service
     */
    async createComment(userId: string, createDto: CreateCommentDto): Promise<Comment> {
        this.logger.log(`Creating comment for task ${createDto.taskId}`);

        try {
            // Create comment object
            if (!createDto.content || createDto.content.trim().length === 0) {
                throw new Error('Comment content cannot be empty');
            }

            const comment = new Comment();
            comment.taskId = createDto.taskId;
            comment.userId = userId;
            comment.content = createDto.content.trim();
            comment.parentId = createDto.parentId;
            comment.isDeleted = false;

            const savedComment = await this.commentsRepository.save(comment);
            this.logger.log(`Comment created successfully: ${savedComment.id}`);

            return savedComment;
        } catch (error) {
            this.logger.error(`Failed to create comment for task: ${createDto.taskId}`, error);
            throw error;
        }
    }

    /**
     * Update comment use-case moved to service
     */
    async updateComment(userId: string, commentId: string, updateDto: UpdateCommentDto): Promise<Comment> {
        this.logger.log(`Updating comment: ${commentId}`);

        try {
            const comment = await this.commentsRepository.findById(commentId);
            if (!comment) {
                throw new NotFoundException('Comment not found');
            }

            // Check if user can update this comment
            if (comment.userId !== userId) {
                throw new ForbiddenException('You can only update your own comments');
            }

            // Update comment content
            if (!updateDto.content || updateDto.content.trim().length === 0) {
                throw new Error('Comment content cannot be empty');
            }
            comment.content = updateDto.content.trim();

            const updatedComment = await this.commentsRepository.save(comment);
            this.logger.log(`Comment updated successfully: ${updatedComment.id}`);

            return updatedComment;
        } catch (error) {
            this.logger.error(`Failed to update comment: ${commentId}`, error);
            throw error;
        }
    }

    /**
     * Delete comment use-case moved to service
     */
    async deleteComment(userId: string, commentId: string): Promise<void> {
        this.logger.log(`Deleting comment: ${commentId}`);

        try {
            const comment = await this.commentsRepository.findById(commentId);
            if (!comment) {
                throw new NotFoundException('Comment not found');
            }

            // Check if user can delete this comment
            if (comment.userId !== userId) {
                throw new ForbiddenException('You can only delete your own comments');
            }

            await this.commentsRepository.delete(commentId);
            this.logger.log(`Comment deleted successfully: ${commentId}`);
        } catch (error) {
            this.logger.error(`Failed to delete comment: ${commentId}`, error);
            throw error;
        }
    }

    /**
     * Get task comments use-case moved to service
     */
    async getTaskComments(taskId: string): Promise<Comment[]> {
        this.logger.log(`Getting comments for task: ${taskId}`);

        try {
            const comments = await this.commentsRepository.findByTaskId(taskId);
            this.logger.log(`Found ${comments.length} comments for task: ${taskId}`);

            return comments;
        } catch (error) {
            this.logger.error(`Failed to get comments for task: ${taskId}`, error);
            throw error;
        }
    }

    /**
     * Get comment by ID
     */
    async getCommentById(commentId: string): Promise<Comment | null> {
        this.logger.log(`Getting comment by ID: ${commentId}`);

        try {
            const comment = await this.commentsRepository.findById(commentId);

            if (comment) {
                this.logger.log(`Comment found: ${commentId}`);
            } else {
                this.logger.log(`Comment not found: ${commentId}`);
            }

            return comment;
        } catch (error) {
            this.logger.error(`Failed to get comment by ID: ${commentId}`, error.stack || error);
            throw error;
        }
    }
}
