import {
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    Inject,
    Param,
    ParseIntPipe,
    ParseUUIDPipe,
    Post,
    Put,
    Query,
    UnauthorizedException,
} from '@nestjs/common';
import { TaskRepositoryPort } from '../../application/ports/output/task-repository.port';
import { CreateTaskPort } from '../../application/use-cases/task/create-task.use-case';
import { ReorderTaskPort } from '../../application/use-cases/task/reorder-task.use-case';
import { UpdateTaskPort } from '../../application/use-cases/task/update-task.use-case';
import { TaskStatus } from '../../domain/entities/task.entity';
import { PaginatedResponse } from '../../shared/utils/paginated-response.util';
import { AuthenticatedUser, User } from '../decorators/authenticated-user.decorator';
import { CreateTaskDto } from '../dto/request/create-task.dto';
import { ReorderTaskDto } from '../dto/request/reorder-task.dto';
import { UpdateTaskDto } from '../dto/request/update-task.dto';
import { TaskResponseDto } from '../dto/response/task-response.dto';
import {
    ApiCreateTask,
    ApiDeleteTask,
    ApiGetTaskById,
    ApiGetTasks,
    ApiGetTasksByProject,
    ApiGetTasksByProjectOrdered,
    ApiReorderTask,
    ApiUpdateTask,
    ApiUpdateTaskStatus,
} from '../swagger/task.swagger';

@Controller('tasks')
export class TaskController {
    constructor(
        @Inject('CreateTaskUseCase')
        private readonly createTaskUseCase: CreateTaskPort,
        @Inject('UpdateTaskUseCase')
        private readonly updateTaskUseCase: UpdateTaskPort,
        @Inject('ReorderTaskUseCase')
        private readonly reorderTaskUseCase: ReorderTaskPort,
        @Inject('TaskRepositoryPort')
        private readonly taskRepository: TaskRepositoryPort,
    ) { }

    @Post()
    @ApiCreateTask()
    async createTask(
        @Body() dto: CreateTaskDto,
        @User() user: AuthenticatedUser
    ): Promise<TaskResponseDto> {
        if (!user?.id) {
            throw new UnauthorizedException('사용자 인증이 필요합니다.');
        }

        const command = {
            title: dto.title,
            description: dto.description,
            projectId: dto.projectId,
            assigneeId: dto.assigneeId,
            assignerId: user.id,
            priority: dto.priority,
            dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
            estimatedHours: dto.estimatedHours,
            tags: dto.tags,
        };

        const task = await this.createTaskUseCase.execute(command);
        return TaskResponseDto.fromEntity(task);
    }

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
        const result = await this.taskRepository.findWithFilters({
            projectId,
            assigneeId,
            status,
            search,
            page,
            limit,
        });

        const taskDtos = result.tasks.map(task => TaskResponseDto.fromEntity(task));

        return PaginatedResponse.create(taskDtos, {
            page: page || 1,
            limit: limit || 10,
            total: result.total,
        });
    }

    @Put('reorder')
    @ApiReorderTask()
    async reorderTask(
        @Body() dto: ReorderTaskDto,
        @User() user: AuthenticatedUser,
    ): Promise<{ task: TaskResponseDto; affectedTasks: TaskResponseDto[] }> {
        console.log('Reorder DTO received:', dto);

        if (!user?.id) {
            throw new UnauthorizedException('사용자 인증이 필요합니다.');
        }

        const command = {
            taskId: dto.taskId,
            projectId: dto.projectId,
            newStatus: dto.newStatus,
            newPosition: dto.newPosition,
            userId: user.id,
        };

        const result = await this.reorderTaskUseCase.execute(command);

        return {
            task: TaskResponseDto.fromEntity(result.task),
            affectedTasks: result.affectedTasks.map(task => TaskResponseDto.fromEntity(task)),
        };
    }

    @Get('project/:projectId/ordered')
    @ApiGetTasksByProjectOrdered()
    async getTasksByProjectOrdered(
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Query('status') status?: TaskStatus,
    ): Promise<{ [key: string]: TaskResponseDto[] }> {
        if (status) {
            const tasks = await this.taskRepository.findByProjectIdAndStatusOrderedByRank(projectId, status);
            return { [status]: tasks.map(task => TaskResponseDto.fromEntity(task)) };
        }

        const todoTasks = await this.taskRepository.findByProjectIdAndStatusOrderedByRank(projectId, TaskStatus.TODO);
        const inProgressTasks = await this.taskRepository.findByProjectIdAndStatusOrderedByRank(projectId, TaskStatus.IN_PROGRESS);
        const completedTasks = await this.taskRepository.findByProjectIdAndStatusOrderedByRank(projectId, TaskStatus.COMPLETED);

        return {
            TODO: todoTasks.map(task => TaskResponseDto.fromEntity(task)),
            IN_PROGRESS: inProgressTasks.map(task => TaskResponseDto.fromEntity(task)),
            COMPLETED: completedTasks.map(task => TaskResponseDto.fromEntity(task)),
        };
    }

    @Get('project/:projectId')
    @ApiGetTasksByProject()
    async getTasksByProject(
        @Param('projectId', ParseUUIDPipe) projectId: string,
    ): Promise<TaskResponseDto[]> {
        const tasks = await this.taskRepository.findByProjectId(projectId);
        return tasks.map(task => TaskResponseDto.fromEntity(task));
    }

    @Get(':id')
    @ApiGetTaskById()
    async getTaskById(@Param('id', ParseUUIDPipe) id: string): Promise<TaskResponseDto> {
        const task = await this.taskRepository.findById(id);
        if (!task) {
            throw new Error(`Task with id ${id} not found`);
        }
        return TaskResponseDto.fromEntity(task);
    }

    @Put(':id/status')
    @ApiUpdateTaskStatus()
    async updateTaskStatus(
        @Param('id') id: string,
        @Body('status') status: TaskStatus,
        @User() user: AuthenticatedUser,
    ): Promise<TaskResponseDto> {
        if (!user?.id) {
            throw new UnauthorizedException('사용자 인증이 필요합니다.');
        }

        const command = {
            taskId: id,
            userId: user.id,
            status,
        };

        const task = await this.updateTaskUseCase.execute(command);
        return TaskResponseDto.fromEntity(task);
    }

    @Put(':id')
    @ApiUpdateTask()
    async updateTask(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateTaskDto,
        @User() user: AuthenticatedUser,
    ): Promise<TaskResponseDto> {
        if (!user?.id) {
            throw new UnauthorizedException('사용자 인증이 필요합니다.');
        }

        const command = {
            taskId: id,
            userId: user.id,
            title: dto.title,
            description: dto.description,
            status: dto.status,
            priority: dto.priority,
            assigneeId: dto.assigneeId,
            dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
            estimatedHours: dto.estimatedHours,
            actualHours: dto.actualHours,
            tags: dto.tags,
            projectId: dto.projectId,
        };

        const task = await this.updateTaskUseCase.execute(command);
        return TaskResponseDto.fromEntity(task);
    }

    @Delete(':id')
    @ApiDeleteTask()
    async deleteTask(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
        await this.taskRepository.delete(id);
        return { message: 'Task deleted successfully' };
    }
}
