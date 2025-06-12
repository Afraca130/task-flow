import {
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    Param,
    ParseUUIDPipe,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateProjectCommand } from '../../application/commands/create-project.command';
import { CreateProjectPort } from '../../application/ports/input/create-project.port';
import { GetProjectPort, GetProjectsPort } from '../../application/ports/input/get-project.port';
import { GetProjectQuery, GetProjectsQuery } from '../../application/queries/get-project.query';
import { PaginatedResponse } from '../../shared/utils/paginated-response.util';
import { AuthenticatedUser, User } from '../decorators/authenticated-user.decorator';
import { CreateProjectDto } from '../dto/request/create-project.dto';
import { UpdateProjectDto } from '../dto/request/update-project.dto';
import { ProjectMemberResponseDto } from '../dto/response/project-member-response.dto';
import { ProjectResponseDto } from '../dto/response/project-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
    ApiCreateProject,
    ApiDeleteProject,
    ApiGetProject,
    ApiGetProjects,
    ApiUpdateProject,
} from '../swagger/decorators/api-project-responses.decorator';

@ApiTags('projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProjectController {
    constructor(
        @Inject('CreateProjectUseCase')
        private readonly createProjectUseCase: CreateProjectPort,
        @Inject('GetProjectUseCase')
        private readonly getProjectUseCase: GetProjectPort,
        @Inject('GetProjectsUseCase')
        private readonly getProjectsUseCase: GetProjectsPort,
        // TODO: Inject update and delete use cases when implemented
        // @Inject('UpdateProjectUseCase')
        // private readonly updateProjectUseCase: UpdateProjectPort,
        // @Inject('DeleteProjectUseCase')
        // private readonly deleteProjectUseCase: DeleteProjectPort,
    ) { }

    @Post()
    @ApiCreateProject(CreateProjectDto)
    async createProject(
        @Body() dto: CreateProjectDto,
        @User() user: AuthenticatedUser,
    ): Promise<ProjectResponseDto> {
        const command = CreateProjectCommand.fromDto(dto, user.id);
        const result = await this.createProjectUseCase.execute(command);

        return ProjectResponseDto.fromDomain(result);
    }

    @Get()
    @ApiGetProjects()
    async getProjects(
        @User() user: AuthenticatedUser,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('search') search?: string,
        @Query('isActive') isActive?: boolean,
    ): Promise<PaginatedResponse<ProjectResponseDto>> {
        const query = new GetProjectsQuery(user.id, { page, limit, search, isActive });
        const result = await this.getProjectsUseCase.execute(query);

        const projectDtos = result.projects.map(project => ProjectResponseDto.fromDomain(project));

        return PaginatedResponse.create(projectDtos, {
            page: result.page,
            limit: result.limit,
            total: result.total,
        });
    }

    @Get(':id')
    @ApiGetProject()
    async getProjectById(
        @Param('id', ParseUUIDPipe) id: string,
        @User() user: AuthenticatedUser,
    ): Promise<ProjectResponseDto> {
        const query = new GetProjectQuery(id, user.id);
        const result = await this.getProjectUseCase.execute(query);

        return ProjectResponseDto.fromDomain(result);
    }

    @Get(':id/members')
    @ApiOperation({ summary: '프로젝트 멤버 조회', description: '특정 프로젝트의 멤버 목록을 조회합니다.' })
    @ApiResponse({
        status: 200,
        description: '프로젝트 멤버 목록 조회 성공',
        type: [ProjectMemberResponseDto],
    })
    @ApiResponse({ status: 404, description: '프로젝트를 찾을 수 없음' })
    @ApiResponse({ status: 403, description: '접근 권한 없음' })
    async getProjectMembers(
        @Param('id', ParseUUIDPipe) projectId: string,
        @User() user: AuthenticatedUser,
    ): Promise<ProjectMemberResponseDto[]> {
        // TODO: Implement proper project member query logic
        // For now, return mock data that includes the current user
        return [
            ProjectMemberResponseDto.fromEntity({
                id: '1',
                projectId,
                userId: user.id,
                role: 'OWNER',
                joinedAt: new Date(),
                isActive: true,
                createdAt: new Date(),
                user: {
                    id: user.id,
                    name: user.name || '현재 사용자',
                    email: user.email || 'user@example.com',
                    profileImage: undefined,
                },
            }),
        ];
    }

    @Put(':id')
    @ApiUpdateProject(UpdateProjectDto)
    async updateProject(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateProjectDto,
        @User() user: AuthenticatedUser,
    ): Promise<ProjectResponseDto> {
        // TODO: Implement update project use case
        // For now, just return the current project
        const query = new GetProjectQuery(id, user.id);
        const result = await this.getProjectUseCase.execute(query);

        return ProjectResponseDto.fromDomain(result);
    }

    @Delete(':id')
    @ApiDeleteProject()
    async deleteProject(
        @Param('id', ParseUUIDPipe) id: string,
        @User() user: AuthenticatedUser,
    ) {
        // TODO: Implement delete project use case
        // For now, just return success message
        return {
            message: `Project ${id} deletion requested by user ${user.id}`,
            success: true,
        };
    }
}
