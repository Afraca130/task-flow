import { TaskStatus } from '@/tasks/entities/task.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsUUID, ValidateNested } from 'class-validator';

export class TaskPositionDto {
    @ApiProperty({
        description: 'Task unique identifier',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @IsNotEmpty({ message: 'Task ID is required' })
    @IsUUID(4, { message: 'Task ID must be valid UUID' })
    readonly taskId: string;

    @ApiProperty({
        description: 'New position index in the list (0-based)',
        example: 2,
        minimum: 0,
    })
    @IsNotEmpty({ message: 'Position is required' })
    readonly position: number;
}

export class ReorderTaskDto {
    @ApiProperty({
        description: 'Task unique identifier to move',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @IsNotEmpty({ message: 'Task ID is required' })
    @IsUUID(4, { message: 'Task ID must be valid UUID' })
    readonly taskId: string;

    @ApiPropertyOptional({
        description: 'New status for the task (if moving between columns)',
        enum: TaskStatus,
        example: TaskStatus.IN_PROGRESS,
    })
    @IsOptional()
    @IsEnum(TaskStatus, { message: 'Status must be a valid task status' })
    readonly newStatus?: TaskStatus;

    @ApiProperty({
        description: 'New position index in the target status column (0-based)',
        example: 1,
        minimum: 0,
    })
    @IsNotEmpty({ message: 'New position is required' })
    readonly newPosition: number;

    @ApiProperty({
        description: 'Project ID to ensure task belongs to correct project',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @IsNotEmpty({ message: 'Project ID is required' })
    @IsUUID(4, { message: 'Project ID must be valid UUID' })
    readonly projectId: string;
}

export class BatchReorderTaskDto {
    @ApiProperty({
        description: 'Array of task positions to update',
        type: [TaskPositionDto],
    })
    @IsArray({ message: 'Tasks must be an array' })
    @ValidateNested({ each: true })
    @Type(() => TaskPositionDto)
    readonly tasks: TaskPositionDto[];

    @ApiProperty({
        description: 'Project ID to ensure tasks belong to correct project',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @IsNotEmpty({ message: 'Project ID is required' })
    @IsUUID(4, { message: 'Project ID must be valid UUID' })
    readonly projectId: string;

    @ApiPropertyOptional({
        description: 'Status to filter tasks (if reordering within specific status)',
        enum: TaskStatus,
        example: TaskStatus.TODO,
    })
    @IsOptional()
    @IsEnum(TaskStatus, { message: 'Status must be a valid task status' })
    readonly status?: TaskStatus;
}
