import { TaskPriority, TaskStatus } from '@/tasks/entities/task.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';


export class TaskAssigneeDto {
    @ApiProperty({
        description: 'User ID',
        example: 'uuid-v4-string',
    })
    @Expose()
    readonly id: string;

    @ApiProperty({
        description: 'User name',
        example: '김민수',
    })
    @Expose()
    readonly name: string;

    @ApiProperty({
        description: 'User email',
        example: 'kim@example.com',
    })
    @Expose()
    readonly email: string;

    @ApiPropertyOptional({
        description: 'User profile image URL',
        example: 'https://example.com/profile.jpg',
    })
    @Expose()
    readonly profileImage?: string;
}

export class TaskProjectDto {
    @ApiProperty({
        description: 'Project ID',
        example: 'uuid-v4-string',
    })
    @Expose()
    readonly id: string;

    @ApiProperty({
        description: 'Project name',
        example: '웹 애플리케이션 개발',
    })
    @Expose()
    readonly name: string;
}

@Exclude()
export class TaskResponseDto {
    @ApiProperty({
        description: 'Task ID',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @Expose()
    readonly id: string;

    @ApiProperty({
        description: 'Task title',
        example: '사용자 인증 시스템 구현',
    })
    @Expose()
    readonly title: string;

    @ApiPropertyOptional({
        description: 'Task description',
        example: 'JWT 토큰 기반 인증 시스템을 구현합니다.',
    })
    @Expose()
    readonly description?: string;

    @ApiProperty({
        description: 'Task status',
        enum: TaskStatus,
        example: TaskStatus.TODO,
    })
    @Expose()
    readonly status: TaskStatus;

    @ApiProperty({
        description: 'Task priority',
        enum: TaskPriority,
        example: TaskPriority.MEDIUM,
    })
    @Expose()
    readonly priority: TaskPriority;

    @ApiProperty({
        description: 'Project ID',
        example: 'uuid-v4-string',
    })
    @Expose()
    readonly projectId: string;

    @ApiPropertyOptional({
        description: 'Assignee ID',
        example: 'uuid-v4-string',
    })
    @Expose()
    readonly assigneeId?: string;

    @ApiProperty({
        description: 'Assigner ID',
        example: 'uuid-v4-string',
    })
    @Expose()
    readonly assignerId: string;

    @ApiPropertyOptional({
        description: 'Task due date',
        example: '2024-12-31T23:59:59Z',
        format: 'date-time',
    })
    @Expose()
    readonly dueDate?: Date;

    @ApiPropertyOptional({
        description: 'Task completion date',
        example: '2024-12-15T14:30:00Z',
        format: 'date-time',
    })
    @Expose()
    readonly completedAt?: Date;

    @ApiPropertyOptional({
        description: 'Estimated hours',
        example: 8,
    })
    @Expose()
    readonly estimatedHours?: number;

    @ApiPropertyOptional({
        description: 'Actual hours spent',
        example: 10,
    })
    @Expose()
    readonly actualHours?: number;

    @ApiPropertyOptional({
        description: 'Task tags',
        example: ['backend', 'authentication'],
        type: [String],
    })
    @Expose()
    readonly tags?: string[];

    @ApiProperty({
        description: 'LexoRank for task ordering in drag and drop',
        example: 'U',
    })
    @Expose()
    readonly lexoRank: string;

    @ApiProperty({
        description: 'Task creation timestamp',
        example: '2024-12-01T10:00:00Z',
        format: 'date-time',
    })
    @Expose()
    readonly createdAt: Date;

    @ApiProperty({
        description: 'Task last update timestamp',
        example: '2024-12-01T15:30:00Z',
        format: 'date-time',
    })
    @Expose()
    readonly updatedAt: Date;

    @ApiPropertyOptional({
        description: 'Task assignee information',
        type: TaskAssigneeDto,
    })
    @Expose()
    @Type(() => TaskAssigneeDto)
    readonly assignee?: TaskAssigneeDto;

    @ApiPropertyOptional({
        description: 'Task assigner information',
        type: TaskAssigneeDto,
    })
    @Expose()
    @Type(() => TaskAssigneeDto)
    readonly assigner?: TaskAssigneeDto;

    @ApiPropertyOptional({
        description: 'Project information',
        type: TaskProjectDto,
    })
    @Expose()
    @Type(() => TaskProjectDto)
    readonly project?: TaskProjectDto;

    @ApiProperty({
        description: 'Task progress percentage',
        example: 50,
        minimum: 0,
        maximum: 100,
    })
    @Expose()
    readonly progressPercentage: number;

    @ApiProperty({
        description: 'Is task overdue',
        example: false,
    })
    @Expose()
    readonly isOverdue: boolean;

    @ApiPropertyOptional({
        description: 'Days until due date',
        example: 5,
    })
    @Expose()
    readonly daysUntilDue?: number;

    constructor(partial: Partial<TaskResponseDto>) {
        Object.assign(this, partial);
    }

    static fromEntity(task: any): TaskResponseDto {
        return new TaskResponseDto({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            projectId: task.projectId,
            assigneeId: task.assigneeId,
            assignerId: task.assignerId,
            dueDate: task.dueDate,
            completedAt: task.completedAt,
            estimatedHours: task.estimatedHours,
            actualHours: task.actualHours,
            tags: task.tags,
            lexoRank: task.lexoRank || 'U',
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            assignee: task.assignee ? {
                id: task.assignee.id,
                name: task.assignee.name,
                email: task.assignee.email,
                profileImage: task.assignee.profileImage,
            } : undefined,
            assigner: task.assigner ? {
                id: task.assigner.id,
                name: task.assigner.name,
                email: task.assigner.email,
                profileImage: task.assigner.profileImage,
            } : undefined,
            project: task.project ? {
                id: task.project.id,
                name: task.project.name,
            } : undefined,
            progressPercentage: task.getProgressPercentage?.() || 0,
            isOverdue: task.isOverdue?.() || false,
            daysUntilDue: task.getDaysUntilDue?.() || undefined,
        });
    }
}
