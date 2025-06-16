import {
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedResponse } from '../common/utils/paginated-response.util';
import { CreateProjectDto } from './dto/request/create-project.dto';
import { UpdateProjectDto } from './dto/request/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new project' })
    create(@Body() createProjectDto: CreateProjectDto) {
        return this.projectsService.create(createProjectDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all projects' })
    @ApiResponse({
        status: 200,
        description: 'Projects retrieved successfully',
        type: PaginatedResponse,
    })
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    ): Promise<PaginatedResponse<any>> {
        const mockProjects = [];
        return PaginatedResponse.create(mockProjects, {
            page,
            limit,
            total: 0,
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get project by ID' })
    findOne(@Param('id') id: string) {
        return this.projectsService.findOne(+id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a project' })
    update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
        return this.projectsService.update(+id, updateProjectDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a project' })
    remove(@Param('id') id: string) {
        return this.projectsService.remove(+id);
    }
}
