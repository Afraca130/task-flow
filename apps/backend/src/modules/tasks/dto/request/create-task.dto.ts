import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { TaskPriority, TaskStatus } from '../../entities/task.entity';


export class CreateTaskDto {
    @ApiProperty({
        description: 'Task title',
        example: '사용자 인증 시스템 구현',
        minLength: 1,
        maxLength: 255,
    })
    @IsNotEmpty({ message: 'Title is required' })
    @IsString({ message: 'Title must be a string' })
    @Transform(({ value }) => value?.trim())
    readonly title: string;

    @ApiPropertyOptional({
        description: 'Task description',
        example: 'JWT 토큰 기반 인증 시스템을 구현합니다.',
    })
    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    @Transform(({ value }) => value?.trim())
    readonly description?: string;

    @ApiProperty({
        description: 'Project ID where task belongs',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @IsNotEmpty({ message: 'Project ID is required' })
    @IsUUID(4, { message: 'Project ID must be valid UUID' })
    readonly projectId: string;

    @ApiPropertyOptional({
        description: 'User ID who will be assigned to this task',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @IsOptional()
    @IsUUID(4, { message: 'Assignee ID must be valid UUID' })
    readonly assigneeId?: string;

    @ApiProperty({
        description: 'User ID who will be assigned to this task',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @IsNotEmpty({ message: 'Assigner ID is required' })
    @IsUUID(4, { message: 'Assigner ID must be valid UUID' })
    readonly assignerId: string;

    @ApiPropertyOptional({
        description: 'Task status',
        enum: TaskStatus,
        example: TaskStatus.TODO,
        default: TaskStatus.TODO,
    })
    @IsOptional()
    @IsEnum(TaskStatus, { message: 'Status must be a valid status' })
    readonly status?: TaskStatus = TaskStatus.TODO;

    @ApiPropertyOptional({
        description: 'Task priority level',
        enum: TaskPriority,
        example: TaskPriority.MEDIUM,
        default: TaskPriority.MEDIUM,
    })
    @IsOptional()
    @IsEnum(TaskPriority, { message: 'Priority must be a valid priority level' })
    readonly priority?: TaskPriority = TaskPriority.MEDIUM;

    @ApiPropertyOptional({
        description: 'Task due date',
        example: '2024-12-31T23:59:59Z',
        format: 'date-time',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Due date must be valid ISO date string' })
    readonly dueDate?: string;

    @ApiPropertyOptional({
        description: 'Task tags',
        example: ['backend', 'authentication', 'security'],
        type: [String],
    })
    @IsOptional()
    @IsArray({ message: 'Tags must be an array' })
    @IsString({ each: true, message: 'Each tag must be a string' })
    @Transform(({ value }) => value?.map((tag: string) => tag.trim()).filter(Boolean))
    readonly tags?: string[];
}
