import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Put,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { CreateIssueDto, UpdateIssueDto } from './dto/request';
import { Issue, IssuePriority, IssueStatus, IssueType } from './entities/issue.entity';
import { IssuesService } from './issues.service';

@ApiTags('issues')
@Controller({ path: 'issues', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class IssuesController {
    constructor(
        private readonly issuesService: IssuesService,
    ) { }

    @Get()
    @ApiOperation({
        summary: 'Get all issues',
        description: 'Retrieves all issues with pagination support',
    })
    @ApiQuery({
        name: 'page',
        description: 'Page number',
        type: 'number',
        required: false,
        example: 1,
    })
    @ApiQuery({
        name: 'limit',
        description: 'Items per page',
        type: 'number',
        required: false,
        example: 10,
    })
    @ApiResponse({
        status: 200,
        description: 'Issues retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Issue' },
                },
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getIssues(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ): Promise<{ data: Issue[]; total: number; page: number; limit: number }> {
        const issues = await this.issuesService.getAllIssues();
        const actualPage = page || 1;
        const actualLimit = limit || 50;
        const startIndex = (actualPage - 1) * actualLimit;
        const endIndex = startIndex + actualLimit;

        return {
            data: issues.slice(startIndex, endIndex),
            total: issues.length,
            page: actualPage,
            limit: actualLimit,
        };
    }

    @Post()
    @ApiOperation({
        summary: 'Create a new issue',
        description: 'Creates a new issue in a project',
    })
    @ApiBody({ type: CreateIssueDto })
    @ApiResponse({
        status: 201,
        description: 'Issue created successfully',
        type: Issue,
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Project not found' })
    async createIssue(
        @Body() createIssueDto: CreateIssueDto,
        @Request() req: any,
    ): Promise<Issue> {
        return await this.issuesService.createIssue(req.user.id, createIssueDto);
    }

    @Post('with-mentions')
    @ApiOperation({
        summary: 'Create a new issue with mentions',
        description: 'Creates a new issue in a project and sends mention notifications',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                issue: { $ref: '#/components/schemas/CreateIssueDto' },
                mentionedUserIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of user IDs to mention and notify'
                }
            },
            required: ['issue']
        }
    })
    @ApiResponse({
        status: 201,
        description: 'Issue created successfully with mentions',
        type: Issue,
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Project not found' })
    async createIssueWithMentions(
        @Body() body: { issue: CreateIssueDto; mentionedUserIds?: string[] },
        @Request() req: any,
    ): Promise<Issue> {
        return await this.issuesService.createIssueWithMentions(
            req.user.id,
            body.issue,
            body.mentionedUserIds || []
        );
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get issue by ID',
        description: 'Retrieves a specific issue by its ID',
    })
    @ApiParam({
        name: 'id',
        description: 'Issue ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: 200,
        description: 'Issue found and returned',
        type: Issue,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Issue not found' })
    async getIssueById(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<Issue | null> {
        return await this.issuesService.getIssueById(id);
    }

    @Put(':id')
    @ApiOperation({
        summary: 'Update an issue',
        description: 'Updates an existing issue',
    })
    @ApiParam({
        name: 'id',
        description: 'Issue ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiBody({ type: UpdateIssueDto })
    @ApiResponse({
        status: 200,
        description: 'Issue updated successfully',
        type: Issue,
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Issue not found' })
    async updateIssue(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateIssueDto: UpdateIssueDto,
        @Request() req: any,
    ): Promise<Issue> {
        return await this.issuesService.updateIssue(req.user.id, id, updateIssueDto);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Delete an issue',
        description: 'Deletes an issue',
    })
    @ApiParam({
        name: 'id',
        description: 'Issue ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: 200,
        description: 'Issue deleted successfully',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Issue not found' })
    async deleteIssue(
        @Param('id', ParseUUIDPipe) id: string,
        @Request() req: any,
    ): Promise<{ message: string }> {
        await this.issuesService.deleteIssue(req.user.id, id);
        return { message: 'Issue deleted successfully' };
    }

    @Get('project/:projectId')
    @ApiOperation({
        summary: 'Get issues by project',
        description: 'Retrieves all issues for a specific project',
    })
    @ApiParam({
        name: 'projectId',
        description: 'Project ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: 200,
        description: 'Issues retrieved successfully',
        type: [Issue],
    })
    async getIssuesByProject(
        @Param('projectId', ParseUUIDPipe) projectId: string,
    ): Promise<Issue[]> {
        return await this.issuesService.getIssuesByProject(projectId);
    }

    @Get('assignee/:userId')
    @ApiOperation({
        summary: 'Get issues by assignee',
        description: 'Retrieves all issues assigned to a specific user',
    })
    @ApiParam({
        name: 'userId',
        description: 'User ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: 200,
        description: 'Issues retrieved successfully',
        type: [Issue],
    })
    async getIssuesByAssignee(
        @Param('userId', ParseUUIDPipe) userId: string,
    ): Promise<Issue[]> {
        return await this.issuesService.getIssuesByAssignee(userId);
    }

    @Get('author/:userId')
    @ApiOperation({
        summary: 'Get issues by author',
        description: 'Retrieves all issues created by a specific user',
    })
    @ApiParam({
        name: 'userId',
        description: 'User ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: 200,
        description: 'Issues retrieved successfully',
        type: [Issue],
    })
    async getIssuesByAuthor(
        @Param('userId', ParseUUIDPipe) userId: string,
    ): Promise<Issue[]> {
        return await this.issuesService.getIssuesByAuthor(userId);
    }

    @Get('search')
    @ApiOperation({
        summary: 'Search issues',
        description: 'Search for issues by title or description',
    })
    @ApiQuery({
        name: 'q',
        description: 'Search query',
        type: 'string',
        required: true,
    })
    @ApiQuery({
        name: 'projectId',
        description: 'Filter by project ID',
        type: 'string',
        required: false,
    })
    @ApiResponse({
        status: 200,
        description: 'Search results retrieved successfully',
        type: [Issue],
    })
    async searchIssues(
        @Query('q') query: string,
        @Query('projectId') projectId?: string,
    ): Promise<Issue[]> {
        return await this.issuesService.searchIssues(query, projectId);
    }

    @Get()
    @ApiOperation({
        summary: 'Get issues with filters',
        description: 'Retrieves issues with optional filters',
    })
    @ApiQuery({ name: 'projectId', required: false, type: 'string' })
    @ApiQuery({ name: 'status', required: false, enum: IssueStatus })
    @ApiQuery({ name: 'priority', required: false, enum: IssuePriority })
    @ApiQuery({ name: 'type', required: false, enum: IssueType })
    @ApiQuery({ name: 'assigneeId', required: false, type: 'string' })
    @ApiQuery({ name: 'authorId', required: false, type: 'string' })
    @ApiResponse({
        status: 200,
        description: 'Filtered issues retrieved successfully',
        type: [Issue],
    })
    async getIssuesWithFilters(
        @Query('projectId') projectId?: string,
        @Query('status') status?: IssueStatus,
        @Query('priority') priority?: IssuePriority,
        @Query('type') type?: IssueType,
        @Query('assigneeId') assigneeId?: string,
        @Query('authorId') authorId?: string,
    ): Promise<Issue[]> {
        return await this.issuesService.getIssuesWithFilters({
            projectId,
            status,
            priority,
            type,
            assigneeId,
            authorId,
        });
    }
}
