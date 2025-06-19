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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/request';
import { CommentResponseDto } from './dto/response';

@ApiTags('comments')
@Controller({ path: 'comments', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CommentController {
    constructor(
        private readonly commentsService: CommentsService,
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
        const result = await this.commentsService.createComment(
            req.user.id,
            createCommentDto,
        );
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
        const comments = await this.commentsService.getTaskComments(taskId);
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
        const result = await this.commentsService.updateComment(
            req.user.id,
            id,
            updateCommentDto,
        );
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
        await this.commentsService.deleteComment(req.user.id, id);
        return { message: 'Comment deleted successfully' };
    }
}
