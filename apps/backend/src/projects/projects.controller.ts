import { GetUser } from '@/decorators/authenticated-user.decorator';
import { User } from '@/users/entities/user.entity';
import {
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    ParseUUIDPipe,
    Patch,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { PaginatedResponse } from '../common/utils/paginated-response.util';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CreateProjectCommand } from './create-project.command';
import { CreateProjectDto } from './dto/request/create-project.dto';
import { UpdateProjectDto } from './dto/request/update-project.dto';
import { ProjectMemberResponseDto } from './dto/response/project-member-response.dto';
import { ProjectMember } from './entities/project-member.entity';
import { Project } from './entities/project.entity';
import { GetProjectQuery } from './get-project.query';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new project' })
    @ApiResponse({ status: 201, description: 'Project created successfully' })
    async createProject(
        @Body() createProjectDto: CreateProjectDto,
        @GetUser() user: User,
    ): Promise<Project> {
        const command = CreateProjectCommand.fromDto(createProjectDto, user.id);
        return await this.projectsService.createProject(command);
    }

    @Get()
    @ApiOperation({ summary: 'Get user projects' })
    @ApiResponse({
        status: 200,
        description: 'Projects retrieved successfully',
        type: PaginatedResponse,
    })
    @ApiQuery({ name: 'userId', description: 'User ID', required: true })
    @ApiQuery({ name: 'page', description: 'Page number', required: false })
    @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
    @ApiQuery({ name: 'search', description: 'Search term', required: false })
    @ApiQuery({ name: 'isActive', description: 'Filter by active status', required: false })
    async getUserProjects(
        @GetUser() user: User,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('search') search?: string,
        @Query('isActive') isActive?: boolean,
    ): Promise<{
        projects: Project[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        return await this.projectsService.getUserProjects(user.id, {
            page,
            limit,
            search,
            isActive,
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get project by ID' })
    @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
    @ApiResponse({ status: 200, description: 'Project found' })
    @ApiResponse({ status: 404, description: 'Project not found' })
    async getProjectById(
        @Param('id', ParseUUIDPipe) id: string,
        @GetUser() user: User,
    ): Promise<Project | null> {
        const query = new GetProjectQuery(id, user.id);
        return await this.projectsService.getProjectById(query);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update project' })
    @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
    @ApiResponse({ status: 200, description: 'Project updated successfully' })
    @ApiResponse({ status: 404, description: 'Project not found' })
    async updateProject(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateProjectDto: UpdateProjectDto,
        @GetUser() user: User,
    ): Promise<Project> {
        return await this.projectsService.updateProject(id, updateProjectDto, user.id);
    }

    @Get(':id/members')
    @ApiOperation({ summary: 'Get project members' })
    @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
    @ApiResponse({
        status: 200,
        description: 'Project members retrieved successfully',
        type: [ProjectMemberResponseDto]
    })
    @ApiResponse({ status: 404, description: 'Project not found' })
    async getProjectMembers(
        @Param('id', ParseUUIDPipe) projectId: string,
        @GetUser() user: User,
    ): Promise<ProjectMember[]> {
        return await this.projectsService.getProjectMembers(projectId, user.id);
    }

    @Patch(':id/members/:userId/role')
    @ApiOperation({ summary: 'Update member role' })
    @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
    @ApiParam({ name: 'userId', description: 'User ID', type: 'string' })
    @ApiResponse({ status: 200, description: 'Member role updated successfully' })
    @ApiResponse({ status: 404, description: 'Project or member not found' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async updateMemberRole(
        @Param('id', ParseUUIDPipe) projectId: string,
        @Param('userId', ParseUUIDPipe) userId: string,
        @Body() body: { role: 'OWNER' | 'MANAGER' | 'MEMBER' },
        @GetUser() currentUser: User,
    ): Promise<void> {
        await this.projectsService.updateMemberRole(projectId, userId, body.role, currentUser.id);
    }

    @Delete(':id/members/:userId')
    @ApiOperation({ summary: 'Remove project member' })
    @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
    @ApiParam({ name: 'userId', description: 'User ID', type: 'string' })
    @ApiResponse({ status: 200, description: 'Member removed successfully' })
    @ApiResponse({ status: 404, description: 'Project or member not found' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async removeProjectMember(
        @Param('id', ParseUUIDPipe) projectId: string,
        @Param('userId', ParseUUIDPipe) userId: string,
        @GetUser() currentUser: User,
    ): Promise<void> {
        await this.projectsService.removeProjectMember(projectId, userId, currentUser.id);
    }
}
