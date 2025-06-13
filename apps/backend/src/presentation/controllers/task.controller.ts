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
    UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TaskRepositoryPort } from '../../application/ports/output/task-repository.port';
import { GetTaskCommentsUseCase } from '../../application/use-cases/comment/get-task-comments.use-case';
import { CreateTaskPort } from '../../application/use-cases/task/create-task.use-case';
import { ReorderTaskCommand, ReorderTaskPort } from '../../application/use-cases/task/reorder-task.use-case';
import { UpdateTaskPort } from '../../application/use-cases/task/update-task.use-case';
import { TaskStatus } from '../../domain/entities/task.entity';
import { PaginatedResponse } from '../../shared/utils/paginated-response.util';
import { AuthenticatedUser, User } from '../decorators/authenticated-user.decorator';
import { CreateTaskDto } from '../dto/request/create-task.dto';
import { ReorderTaskDto } from '../dto/request/reorder-task.dto';
import { UpdateTaskDto } from '../dto/request/update-task.dto';
import { CommentResponseDto } from '../dto/response/comment-response.dto';
import { TaskResponseDto } from '../dto/response/task-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
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


@ApiTags('tasks')
@UseGuards(JwtAuthGuard)
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
        private readonly getTaskCommentsUseCase: GetTaskCommentsUseCase,
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
            status: dto.status,
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
        console.log('Reorder task request:', JSON.stringify(dto, null, 2));

        if (!user?.id) {
            throw new UnauthorizedException('사용자 인증이 필요합니다.');
        }

        const command: ReorderTaskCommand = {
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
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    ): Promise<{ [key: string]: TaskResponseDto[] }> {
        if (status) {
            const tasks = await this.taskRepository.findByProjectIdAndStatusOrderedByRank(projectId, status);
            const limitedTasks = tasks.slice(0, limit);
            return { [status]: limitedTasks.map(task => TaskResponseDto.fromEntity(task)) };
        }

        // 각 status별로 limit 적용하여 조회
        const [todoTasks, inProgressTasks, completedTasks] = await Promise.all([
            this.taskRepository.findByProjectIdAndStatusOrderedByRank(projectId, TaskStatus.TODO),
            this.taskRepository.findByProjectIdAndStatusOrderedByRank(projectId, TaskStatus.IN_PROGRESS),
            this.taskRepository.findByProjectIdAndStatusOrderedByRank(projectId, TaskStatus.COMPLETED),
        ]);

        return {
            TODO: todoTasks.slice(0, limit).map(task => TaskResponseDto.fromEntity(task)),
            IN_PROGRESS: inProgressTasks.slice(0, limit).map(task => TaskResponseDto.fromEntity(task)),
            COMPLETED: completedTasks.slice(0, limit).map(task => TaskResponseDto.fromEntity(task)),
        };
    }

    @Get('project/:projectId/status/:status/all')
    @ApiOperation({
        summary: 'Get all tasks by project and status',
        description: 'Retrieves all tasks for a specific project and status with pagination',
    })
    @ApiParam({
        name: 'projectId',
        description: 'Project unique identifier',
        type: 'string',
        format: 'uuid',
    })
    @ApiParam({
        name: 'status',
        description: 'Task status',
        enum: TaskStatus,
    })
    @ApiQuery({
        name: 'page',
        description: 'Page number (1-based)',
        type: 'integer',
        example: 1,
        required: false,
    })
    @ApiQuery({
        name: 'limit',
        description: 'Number of items per page',
        type: 'integer',
        example: 20,
        required: false,
    })
    @ApiOkResponse({
        description: 'Tasks retrieved successfully',
        type: [TaskResponseDto],
    })
    async getAllTasksByProjectAndStatus(
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('status') status: TaskStatus,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    ): Promise<PaginatedResponse<TaskResponseDto>> {
        const result = await this.taskRepository.findWithFilters({
            projectId,
            status,
            page,
            limit
        });

        const taskDtos = result.tasks.map(task => TaskResponseDto.fromEntity(task));

        return PaginatedResponse.create(taskDtos, {
            page: page || 1,
            limit: limit || 20,
            total: result.total,
        });
    }

    @Get('project/:projectId')
    @ApiGetTasksByProject()
    async getTasksByProject(
        @Param('projectId', ParseUUIDPipe) projectId: string,
    ): Promise<TaskResponseDto[]> {
        const tasks = await this.taskRepository.findByProjectId(projectId);
        console.log('tasks', tasks.filter(task => task.status === TaskStatus.COMPLETED).map(task => ({ title: task.title, task: task.lexoRank })))
        return tasks.map(task => TaskResponseDto.fromEntity(task));
    }

    @Get(':id')
    @ApiGetTaskById()
    async getTaskById(@Param('id', ParseUUIDPipe) id: string): Promise<TaskResponseDto> {
        const task = await this.taskRepository.findById(id);
        if (!task) {
            throw new UnauthorizedException('Task not found');
        }
        return TaskResponseDto.fromEntity(task);
    }

    @Get(':id/comments')
    @ApiOperation({
        summary: 'Get comments for a task',
        description: 'Retrieves all comments for a specific task',
    })
    @ApiParam({
        name: 'id',
        description: 'Task ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiOkResponse({
        description: 'Comments retrieved successfully',
        type: [CommentResponseDto],
    })
    async getTaskComments(
        @Param('id', ParseUUIDPipe) taskId: string,
    ): Promise<CommentResponseDto[]> {
        try {
            const comments = await this.getTaskCommentsUseCase.execute({ taskId });
            return comments.map(comment => CommentResponseDto.fromDomain(comment));
        } catch (error) {
            // 댓글이 없거나 에러가 있어도 빈 배열 반환
            console.warn(`Failed to load comments for task ${taskId}:`, error.message);
            return [];
        }
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
