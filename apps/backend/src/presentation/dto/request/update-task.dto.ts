import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { TaskPriority, TaskStatus } from '../../../domain/entities/task.entity';

export class UpdateTaskDto {
    @ApiPropertyOptional({
        description: 'Task title',
        example: '사용자 인증 시스템 구현 (수정)',
    })
    @IsOptional()
    @IsString({ message: 'Title must be a string' })
    @Transform(({ value }) => value?.trim())
    readonly title?: string;

    @ApiPropertyOptional({
        description: 'Task description',
        example: 'JWT 토큰 기반 인증 시스템을 구현합니다. (수정된 설명)',
    })
    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    @Transform(({ value }) => value?.trim())
    readonly description?: string;

    @ApiPropertyOptional({
        description: 'Task status',
        enum: TaskStatus,
        example: TaskStatus.IN_PROGRESS,
    })
    @IsOptional()
    @IsEnum(TaskStatus, { message: 'Status must be a valid status' })
    readonly status?: TaskStatus;

    @ApiPropertyOptional({
        description: 'Task priority level',
        enum: TaskPriority,
        example: TaskPriority.HIGH,
    })
    @IsOptional()
    @IsEnum(TaskPriority, { message: 'Priority must be a valid priority level' })
    readonly priority?: TaskPriority;

    @ApiPropertyOptional({
        description: 'User ID who will be assigned to this task',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @IsOptional()
    @IsUUID(4, { message: 'Assignee ID must be valid UUID' })
    @Transform(({ value }) => value === '' ? undefined : value)
    readonly assigneeId?: string;

    @ApiPropertyOptional({
        description: 'Task due date',
        example: '2024-12-31T23:59:59Z',
        format: 'date-time',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Due date must be valid ISO date string' })
    readonly dueDate?: string;

    @ApiPropertyOptional({
        description: 'Estimated hours to complete the task',
        example: 12,
        minimum: 0,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Estimated hours must be a number' })
    @Min(0, { message: 'Estimated hours cannot be negative' })
    readonly estimatedHours?: number;

    @ApiPropertyOptional({
        description: 'Actual hours spent on the task',
        example: 8,
        minimum: 0,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Actual hours must be a number' })
    @Min(0, { message: 'Actual hours cannot be negative' })
    readonly actualHours?: number;

    @ApiPropertyOptional({
        description: 'Task tags',
        example: ['backend', 'authentication', 'security', 'updated'],
        type: [String],
    })
    @IsOptional()
    @IsArray({ message: 'Tags must be an array' })
    @IsString({ each: true, message: 'Each tag must be a string' })
    @Transform(({ value }) => value?.map((tag: string) => tag.trim()).filter(Boolean))
    readonly tags?: string[];

    @ApiPropertyOptional({
        description: 'Project ID where task belongs',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @IsOptional()
    @IsUUID(4, { message: 'Project ID must be valid UUID' })
    readonly projectId?: string;
}
