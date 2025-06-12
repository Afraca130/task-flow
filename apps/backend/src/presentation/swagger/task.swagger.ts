import { applyDecorators } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiCreatedResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiUnauthorizedResponse,
    getSchemaPath
} from '@nestjs/swagger';
import { TaskStatus } from '../../domain/entities/task.entity';
import { CreateTaskDto } from '../dto/request/create-task.dto';
import { ReorderTaskDto } from '../dto/request/reorder-task.dto';
import { UpdateTaskDto } from '../dto/request/update-task.dto';
import { ErrorResponseDto } from '../dto/response/error-response.dto';
import { TaskResponseDto } from '../dto/response/task-response.dto';

export const ApiCreateTask = () => applyDecorators(
    ApiOperation({
        summary: 'Create a new task',
        description: 'Creates a new task with the provided information',
    }),
    ApiBody({
        type: CreateTaskDto,
        description: 'Task creation data',
    }),
    ApiCreatedResponse({
        description: 'Task successfully created',
        type: TaskResponseDto,
    }),
    ApiBadRequestResponse({
        description: 'Invalid input data',
        type: ErrorResponseDto,
    }),
    ApiInternalServerErrorResponse({
        description: 'Internal server error',
        type: ErrorResponseDto,
    })
);

export const ApiGetTaskById = () => applyDecorators(
    ApiOperation({
        summary: 'Get task by ID',
        description: 'Retrieves a specific task by its unique identifier',
    }),
    ApiParam({
        name: 'id',
        description: 'Task unique identifier',
        type: 'string',
        format: 'uuid',
        example: 'uuid-v4-string',
    }),
    ApiOkResponse({
        description: 'Task found and returned',
        type: TaskResponseDto,
    }),
    ApiNotFoundResponse({
        description: 'Task not found',
        type: ErrorResponseDto,
    })
);

export const ApiUpdateTask = () => applyDecorators(
    ApiOperation({
        summary: 'Update task',
        description: 'Updates an existing task with the provided information',
    }),
    ApiParam({
        name: 'id',
        description: 'Task unique identifier',
        type: 'string',
        format: 'uuid',
        example: 'uuid-v4-string',
    }),
    ApiBody({
        type: UpdateTaskDto,
        description: 'Task update data',
    }),
    ApiOkResponse({
        description: 'Task successfully updated',
        type: TaskResponseDto,
    }),
    ApiBadRequestResponse({
        description: 'Invalid input data',
        type: ErrorResponseDto,
    }),
    ApiNotFoundResponse({
        description: 'Task not found',
        type: ErrorResponseDto,
    })
);

export const ApiDeleteTask = () => applyDecorators(
    ApiOperation({
        summary: 'Delete task',
        description: 'Deletes a task by its ID',
    }),
    ApiParam({
        name: 'id',
        description: 'Task unique identifier',
        type: 'string',
        format: 'uuid',
        example: 'uuid-v4-string',
    }),
    ApiOkResponse({
        description: 'Task successfully deleted',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Task deleted successfully' }
            }
        }
    }),
    ApiNotFoundResponse({
        description: 'Task not found',
        type: ErrorResponseDto,
    })
);

export const ApiGetTasks = () => applyDecorators(
    ApiOperation({
        summary: 'Get tasks list',
        description: 'Retrieves a list of tasks with optional filtering',
    }),
    ApiQuery({
        name: 'projectId',
        description: 'Filter by project ID',
        type: 'string',
        required: false,
    }),
    ApiQuery({
        name: 'assigneeId',
        description: 'Filter by assignee ID',
        type: 'string',
        required: false,
    }),
    ApiQuery({
        name: 'status',
        description: 'Filter by task status',
        enum: TaskStatus,
        required: false,
    }),
    ApiQuery({
        name: 'search',
        description: 'Search term for filtering tasks',
        type: 'string',
        required: false,
    }),
    ApiQuery({
        name: 'page',
        description: 'Page number (1-based)',
        type: 'integer',
        example: 1,
        required: false,
    }),
    ApiQuery({
        name: 'limit',
        description: 'Number of items per page',
        type: 'integer',
        example: 10,
        required: false,
    }),
    ApiOkResponse({
        description: 'Tasks list retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: { $ref: getSchemaPath(TaskResponseDto) },
                },
                meta: {
                    type: 'object',
                    properties: {
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 10 },
                        total: { type: 'integer', example: 100 },
                        totalPages: { type: 'integer', example: 10 },
                    },
                },
            },
        },
    })
);

export const ApiGetTasksByProject = () => applyDecorators(
    ApiOperation({
        summary: 'Get tasks by project ID',
        description: 'Retrieves all tasks for a specific project with drag and drop support, ordered by rank',
    }),
    ApiParam({
        name: 'projectId',
        description: 'Project unique identifier',
        type: 'string',
        format: 'uuid',
        example: 'uuid-v4-string',
    }),
    ApiOkResponse({
        description: 'Project tasks retrieved successfully',
        type: [TaskResponseDto],
    })
);

export const ApiUpdateTaskStatus = () => applyDecorators(
    ApiOperation({
        summary: 'Update task status',
        description: 'Updates only the status of a task (useful for simple drag and drop)',
    }),
    ApiParam({
        name: 'id',
        description: 'Task unique identifier',
        type: 'string',
        format: 'uuid',
        example: 'uuid-v4-string',
    }),
    ApiBody({
        schema: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    enum: Object.values(TaskStatus),
                    example: TaskStatus.IN_PROGRESS,
                },
            },
            required: ['status'],
        },
    }),
    ApiOkResponse({
        description: 'Task status successfully updated',
        type: TaskResponseDto,
    }),
    ApiUnauthorizedResponse({
        description: 'Authentication required',
        type: ErrorResponseDto,
    }),
    ApiBadRequestResponse({
        description: 'Invalid input data',
        type: ErrorResponseDto,
    }),
    ApiNotFoundResponse({
        description: 'Task not found',
        type: ErrorResponseDto,
    })
);

export const ApiReorderTask = () => applyDecorators(
    ApiOperation({
        summary: 'Reorder task with LexoRank',
        description: 'Moves a task to a new position within the same status or between different statuses using LexoRank algorithm',
    }),
    ApiBody({
        type: ReorderTaskDto,
        description: 'Task reorder data including new position and optional status change',
    }),
    ApiOkResponse({
        description: 'Task successfully reordered',
        schema: {
            type: 'object',
            properties: {
                task: { $ref: getSchemaPath(TaskResponseDto) },
                affectedTasks: {
                    type: 'array',
                    items: { $ref: getSchemaPath(TaskResponseDto) },
                    description: 'Other tasks that were reordered due to rank conflicts'
                }
            }
        }
    }),
    ApiUnauthorizedResponse({
        description: 'Authentication required',
        type: ErrorResponseDto,
    }),
    ApiBadRequestResponse({
        description: 'Invalid input data or task does not belong to project',
        type: ErrorResponseDto,
    }),
    ApiNotFoundResponse({
        description: 'Task not found',
        type: ErrorResponseDto,
    })
);

export const ApiGetTasksByProjectOrdered = () => applyDecorators(
    ApiOperation({
        summary: 'Get tasks by project ID ordered by rank',
        description: 'Retrieves all tasks for a specific project ordered by LexoRank for drag and drop interface',
    }),
    ApiParam({
        name: 'projectId',
        description: 'Project unique identifier',
        type: 'string',
        format: 'uuid',
        example: 'uuid-v4-string',
    }),
    ApiQuery({
        name: 'status',
        description: 'Filter by task status',
        enum: TaskStatus,
        required: false,
    }),
    ApiOkResponse({
        description: 'Project tasks retrieved successfully ordered by rank',
        schema: {
            type: 'object',
            properties: {
                TODO: {
                    type: 'array',
                    items: { $ref: getSchemaPath(TaskResponseDto) },
                    description: 'Tasks in TODO status ordered by rank'
                },
                IN_PROGRESS: {
                    type: 'array',
                    items: { $ref: getSchemaPath(TaskResponseDto) },
                    description: 'Tasks in IN_PROGRESS status ordered by rank'
                },
                COMPLETED: {
                    type: 'array',
                    items: { $ref: getSchemaPath(TaskResponseDto) },
                    description: 'Tasks in COMPLETED status ordered by rank'
                }
            }
        }
    })
);
