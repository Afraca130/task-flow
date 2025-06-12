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
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CreateProjectCommand } from '../../application/commands/create-project.command';
import { CreateProjectPort } from '../../application/ports/input/create-project.port';
import { GetProjectPort, GetProjectsPort } from '../../application/ports/input/get-project.port';
import { GetProjectQuery, GetProjectsQuery } from '../../application/queries/get-project.query';
import { CreateProjectDto, ProjectPriority } from '../dto/request/create-project.dto';
import { UpdateProjectDto } from '../dto/request/update-project.dto';
import { ProjectResponseDto } from '../dto/response/project-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
    ApiCreateProject,
    ApiDeleteProject,
    ApiGetProject,
    ApiGetProjects,
    ApiUpdateProject,
} from '../swagger/decorators/api-project-responses.decorator';

interface PaginatedResponse<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

class ProjectMemberUserDto {
    @ApiProperty({ description: '사용자 ID' })
    id: string;

    @ApiProperty({ description: '사용자 이름' })
    name: string;

    @ApiProperty({ description: '사용자 이메일' })
    email: string;

    @ApiProperty({ description: '프로필 이미지 URL', required: false })
    profileImage?: string;
}

class ProjectMemberResponseDto {
    @ApiProperty({ description: '멤버 ID' })
    id: string;

    @ApiProperty({ description: '프로젝트 ID' })
    projectId: string;

    @ApiProperty({ description: '사용자 ID' })
    userId: string;

    @ApiProperty({ description: '역할', enum: ['OWNER', 'MANAGER', 'MEMBER'] })
    role: 'OWNER' | 'MANAGER' | 'MEMBER';

    @ApiProperty({ description: '가입일' })
    joinedAt: string;

    @ApiProperty({ description: '활성 상태' })
    isActive: boolean;

    @ApiProperty({ description: '생성일' })
    createdAt: string;

    @ApiProperty({ description: '사용자 정보', type: ProjectMemberUserDto })
    user: ProjectMemberUserDto;
}

interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        name: string;
        profileImage?: string;
    };
}

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
        @Req() req: AuthenticatedRequest,
    ): Promise<ProjectResponseDto> {
        const userId = req.user?.id;

        const command = CreateProjectCommand.fromDto(dto, userId);
        const result = await this.createProjectUseCase.execute(command);

        return ProjectResponseDto.fromDomain(result);
    }

    @Get()
    @ApiGetProjects()
    async getProjects(
        @Req() req: AuthenticatedRequest,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('search') search?: string,
        @Query('isActive') isActive?: boolean,
    ): Promise<PaginatedResponse<ProjectResponseDto>> {
        const userId = req.user?.id;

        const query = new GetProjectsQuery(userId, { page, limit, search, isActive });
        const result = await this.getProjectsUseCase.execute(query);

        return {
            data: result.projects.map(project => ProjectResponseDto.fromDomain(project)),
            meta: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
            },
        };
    }

    @Get(':id')
    @ApiGetProject()
    async getProjectById(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: AuthenticatedRequest,
    ): Promise<ProjectResponseDto> {
        const userId = req.user?.id;

        const query = new GetProjectQuery(id, userId);
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
        @Req() req: AuthenticatedRequest,
    ): Promise<ProjectMemberResponseDto[]> {
        const userId = req.user?.id;

        // TODO: Implement proper project member query logic
        // For now, return mock data that includes the current user
        return [
            {
                id: '1',
                projectId,
                userId,
                role: 'OWNER',
                joinedAt: new Date().toISOString(),
                isActive: true,
                createdAt: new Date().toISOString(),
                user: {
                    id: userId,
                    name: req.user?.name || '현재 사용자',
                    email: req.user?.email || 'user@example.com',
                    profileImage: req.user?.profileImage,
                },
            },
        ];
    }

    @Put(':id')
    @ApiUpdateProject(UpdateProjectDto)
    async updateProject(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateProjectDto,
        @Req() req: AuthenticatedRequest,
    ): Promise<ProjectResponseDto> {
        const userId = req.user?.id;

        // TODO: Implement project update logic
        // const command = UpdateProjectCommand.fromDto(id, dto, userId);
        // const result = await this.updateProjectUseCase.execute(command);
        // return ProjectResponseDto.fromDomain(result);

        // Temporary mock response
        return new ProjectResponseDto({
            id,
            name: dto.name || 'TaskFlow 프로젝트',
            description: dto.description || '태스크 관리 애플리케이션',
            color: dto.color || '#3B82F6',
            iconUrl: dto.iconUrl,
            priority: dto.priority || ProjectPriority.HIGH,
            dueDate: dto.dueDate,
            isActive: dto.isActive ?? true,
            ownerId: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
            memberCount: 3,
            taskCount: 12,
        });
    }

    @Delete(':id')
    @ApiDeleteProject()
    async deleteProject(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: AuthenticatedRequest,
    ) {
        const userId = req.user?.id;

        // TODO: Implement project deletion logic
        // const command = new DeleteProjectCommand(id, userId);
        // await this.deleteProjectUseCase.execute(command);

        return { message: '프로젝트가 성공적으로 삭제되었습니다' };
    }
}
