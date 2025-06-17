import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { NotificationType } from '../../entities/notification.entity';

export class CreateNotificationDto {
    @ApiProperty({
        description: 'User ID who will receive the notification',
        example: 'uuid-string',
        format: 'uuid',
    })
    @IsString()
    @IsNotEmpty()
    readonly userId: string;

    @ApiProperty({
        description: 'Notification type',
        enum: NotificationType,
        example: NotificationType.TASK_ASSIGNED,
    })
    @IsEnum(NotificationType)
    readonly type: NotificationType;

    @ApiProperty({
        description: 'Notification title',
        example: '새 업무가 할당되었습니다',
    })
    @IsString()
    @IsNotEmpty()
    readonly title: string;

    @ApiProperty({
        description: 'Notification message',
        example: 'John님이 "API 개발" 업무를 할당했습니다.',
    })
    @IsString()
    @IsNotEmpty()
    readonly message: string;

    @ApiPropertyOptional({
        description: 'Additional notification data',
        example: { taskId: 'task-uuid', assignerName: 'John' },
    })
    @IsObject()
    @IsOptional()
    readonly data?: any;

    @ApiPropertyOptional({
        description: 'Related entity type',
        example: 'task',
    })
    @IsString()
    @IsOptional()
    readonly relatedEntityType?: string;

    @ApiPropertyOptional({
        description: 'Related entity ID',
        example: 'uuid-string',
    })
    @IsString()
    @IsOptional()
    readonly relatedEntityId?: string;
}
