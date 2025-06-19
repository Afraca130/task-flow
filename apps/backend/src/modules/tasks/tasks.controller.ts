import {
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    ParseUUIDPipe,
    Post,
    Put,
    Query,
    UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginatedResponse } from '../../common/utils/paginated-response.util';
import { GetUser } from '../../decorators/authenticated-user.decorator';
import {
    ApiCreateTask,
    ApiDeleteTask,
    ApiGetTaskById,
    ApiGetTasks,
    ApiGetTasksByProject,
    ApiReorderTask,
    ApiUpdateTask
} from '../../swagger/decorators/api-task-responses.swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateTaskDto } from './dto/request/create-task.dto';
import { ReorderTaskDto } from './dto/request/reorder-task.dto';
import { UpdateTaskDto } from './dto/request/update-task.dto';
import { TaskResponseDto } from './dto/response/task-response.dto';
import { TaskStatus } from './entities/task.entity';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@Controller('tasks')
export class TasksController {
    constructor(
        private readonly tasksService: TasksService,
    ) { }

    @Get()
    @ApiGetTasks()
    async getTasks(
        @Query('projectId') projectId?: string,
        @Query('assigneeId') assigneeId?: string,
        @Query('status') status?: TaskStatus,
        @Query('search') search?: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    ): Promise<PaginatedResponse<TaskResponseDto>> {
        const result = await this.tasksService.findWithFilters({
            projectId,
            assigneeId,
            status,
            search,
            page,
            limit,
        });

        const taskResponseDtos = result.tasks.map(task => TaskResponseDto.fromEntity(task));
        return PaginatedResponse.create(taskResponseDtos, {
            page: page || 1,
            limit: limit || 10,
            total: result.total,
        });
    }

    @Get(':id')
    @ApiGetTaskById()
    async getTaskById(@Param('id', ParseUUIDPipe) id: string): Promise<TaskResponseDto | null> {
        const task = await this.tasksService.findById(id);
        return task ? TaskResponseDto.fromEntity(task) : null;
    }

    @Get('project/:projectId')
    @ApiGetTasksByProject()
    async getTasksByProject(
        @Param('projectId', ParseUUIDPipe) projectId: string,
    ): Promise<TaskResponseDto[]> {
        const tasks = await this.tasksService.findByProjectId(projectId);
        return tasks.map(task => TaskResponseDto.fromEntity(task));
    }

    @Get('project/:projectId/status/:status')
    async getTasksByProjectAndStatus(
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('status') status: TaskStatus,
    ): Promise<TaskResponseDto[]> {
        const tasks = await this.tasksService.findByProjectIdAndStatus(projectId, status);
        return tasks.map(task => TaskResponseDto.fromEntity(task));
    }

    @Get('project/:projectId/stats')
    async getTaskStatsByProject(
        @Param('projectId', ParseUUIDPipe) projectId: string,
    ): Promise<{
        total: number;
        todo: number;
        inProgress: number;
        completed: number;
    }> {
        return await this.tasksService.getTaskStatsByProject(projectId);
    }

    @Post()
    @ApiCreateTask()
    async createTask(
        @Body() createTaskDto: CreateTaskDto,
        @GetUser() user: User,
    ): Promise<TaskResponseDto> {
        const task = await this.tasksService.createTask(createTaskDto, user.id);
        return TaskResponseDto.fromEntity(task);
    }

    @Put(':id')
    @ApiUpdateTask()
    async updateTask(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateTaskDto: UpdateTaskDto,
        @GetUser() user: User,
    ): Promise<TaskResponseDto> {
        const updatedTask = await this.tasksService.updateTask(id, user.id, updateTaskDto);
        return TaskResponseDto.fromEntity(updatedTask);
    }

    @Put(':id/reorder')
    @ApiReorderTask()
    async reorderTask(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() reorderDto: ReorderTaskDto,
        @GetUser() user: User,
    ): Promise<{
        task: TaskResponseDto;
        affectedTasks: TaskResponseDto[];
    }> {
        const result = await this.tasksService.reorderTask(
            id,
            reorderDto.projectId,
            reorderDto.newPosition,
            reorderDto.newStatus,
            user.id
        );

        return {
            task: TaskResponseDto.fromEntity(result.task),
            affectedTasks: result.affectedTasks.map(task => TaskResponseDto.fromEntity(task)),
        };
    }

    @Delete(':id')
    @ApiDeleteTask()
    async deleteTask(
        @Param('id', ParseUUIDPipe) id: string,
        @GetUser() user: User,
    ): Promise<{ message: string }> {
        await this.tasksService.deleteTask(id, user.id);
        return { message: 'Task deleted successfully' };
    }
}
