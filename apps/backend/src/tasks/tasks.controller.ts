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
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginatedResponse } from '../common/utils/paginated-response.util';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/request/create-task.dto';
import { UpdateTaskDto } from './dto/request/update-task.dto';
import { TaskResponseDto } from './dto/response/task-response.dto';
import { TasksService } from './tasks.service';

// Temporary interfaces until we fix the architecture
interface TaskRepositoryPort {
    findWithFilters(filters: any): Promise<{ tasks: any[]; total: number }>;
    findByProjectIdAndStatusOrderedByRank(projectId: string, status: any): Promise<any[]>;
    findById(id: string): Promise<any>;
    save(task: any): Promise<any>;
    delete(id: string): Promise<void>;
}

interface CreateTaskPort {
    execute(command: any): Promise<any>;
}

interface UpdateTaskPort {
    execute(command: any): Promise<any>;
}

interface ReorderTaskPort {
    execute(command: any): Promise<{ task: any; affectedTasks: any[] }>;
}

interface GetTaskCommentsUseCase {
    execute(query: any): Promise<any[]>;
}

interface AuthenticatedUser {
    id: string;
    email: string;
    name: string;
}

interface ReorderTaskCommand {
    taskId: string;
    projectId: string;
    newStatus: any;
    newPosition: number;
    userId: string;
}

enum TaskStatus {
    TODO = 'TODO',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED'
}

class CommentResponseDto {
    static fromEntity(comment: any): CommentResponseDto {
        return comment; // Simplified implementation
    }
}

// Custom decorators
const User = () => (target: any, propertyKey: string, parameterIndex: number) => {
    // Implementation would go here
};

@ApiTags('tasks')
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TaskController {
    constructor(
        private readonly tasksService: TasksService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Get all tasks' })
    @ApiOkResponse({
        description: 'Tasks retrieved successfully',
        type: PaginatedResponse,
    })
    async getTasks(
        @Query('projectId') projectId?: string,
        @Query('assigneeId') assigneeId?: string,
        @Query('status') status?: TaskStatus,
        @Query('search') search?: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    ): Promise<PaginatedResponse<TaskResponseDto>> {
        // Simplified implementation for now
        const mockTasks = [];
        return PaginatedResponse.create(mockTasks, {
            page: page || 1,
            limit: limit || 10,
            total: 0,
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get task by ID' })
    async getTaskById(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.tasksService.findOne(Number(id));
    }

    @Post()
    @ApiOperation({ summary: 'Create a new task' })
    async createTask(@Body() createTaskDto: CreateTaskDto): Promise<any> {
        return this.tasksService.create(createTaskDto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a task' })
    async updateTask(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateTaskDto: UpdateTaskDto
    ): Promise<any> {
        return this.tasksService.update(Number(id), updateTaskDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a task' })
    async deleteTask(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
        this.tasksService.remove(Number(id));
        return { message: 'Task deleted successfully' };
    }
}
