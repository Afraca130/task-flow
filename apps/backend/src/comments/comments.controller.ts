import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Put,
    Request,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CreateCommentUseCase } from './create-comment.use-case';
import { DeleteCommentUseCase } from './delete-comment.use-case';
import { CreateCommentDto } from './dto/request/create-comment.dto';
import { UpdateCommentDto } from './dto/request/update-comment.dto';
import { CommentResponseDto } from './dto/response/comment-response.dto';
import { GetTaskCommentsUseCase } from './get-task-comments.use-case';
import { UpdateCommentUseCase } from './update-comment.use-case';

@ApiTags('comments')
@Controller({ path: 'comments', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CommentController {
    constructor(
        private readonly createCommentUseCase: CreateCommentUseCase,
        private readonly getTaskCommentsUseCase: GetTaskCommentsUseCase,
        private readonly updateCommentUseCase: UpdateCommentUseCase,
        private readonly deleteCommentUseCase: DeleteCommentUseCase,
    ) { }

    @Post()
    @ApiOperation({
        summary: 'Create a new comment',
        description: 'Creates a new comment for a task',
    })
    @ApiBody({ type: CreateCommentDto })
    @ApiResponse({
        status: 201,
        description: 'Comment created successfully',
        type: CommentResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Task not found' })
    async createComment(
        @Body() createCommentDto: CreateCommentDto,
        @Request() req: any,
    ): Promise<CommentResponseDto> {
        const result = await this.createCommentUseCase.execute({
            ...createCommentDto,
            userId: req.user.id,
        });
        return CommentResponseDto.fromDomain(result);
    }

    @Get('task/:taskId')
    @ApiOperation({
        summary: 'Get comments for a task',
        description: 'Retrieves all comments for a specific task',
    })
    @ApiParam({
        name: 'taskId',
        description: 'Task ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: 200,
        description: 'Comments retrieved successfully',
        type: [CommentResponseDto],
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Task not found' })
    async getTaskComments(
        @Param('taskId', ParseUUIDPipe) taskId: string,
    ): Promise<CommentResponseDto[]> {
        const comments = await this.getTaskCommentsUseCase.execute({ taskId });
        return comments.map(comment => CommentResponseDto.fromDomain(comment));
    }

    @Put(':id')
    @ApiOperation({
        summary: 'Update a comment',
        description: 'Updates an existing comment (only by the author)',
    })
    @ApiParam({
        name: 'id',
        description: 'Comment ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiBody({ type: UpdateCommentDto })
    @ApiResponse({
        status: 200,
        description: 'Comment updated successfully',
        type: CommentResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - not the author' })
    @ApiResponse({ status: 404, description: 'Comment not found' })
    async updateComment(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateCommentDto: UpdateCommentDto,
        @Request() req: any,
    ): Promise<CommentResponseDto> {
        const result = await this.updateCommentUseCase.execute({
            commentId: id,
            content: updateCommentDto.content,
            userId: req.user.id,
        });
        return CommentResponseDto.fromDomain(result);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Delete a comment',
        description: 'Deletes a comment (only by the author)',
    })
    @ApiParam({
        name: 'id',
        description: 'Comment ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: 200,
        description: 'Comment deleted successfully',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - not the author' })
    @ApiResponse({ status: 404, description: 'Comment not found' })
    async deleteComment(
        @Param('id', ParseUUIDPipe) id: string,
        @Request() req: any,
    ): Promise<{ message: string }> {
        await this.deleteCommentUseCase.execute({
            commentId: id,
            userId: req.user.id,
        });
        return { message: 'Comment deleted successfully' };
    }
}
