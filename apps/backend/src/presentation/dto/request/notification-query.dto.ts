import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { NotificationType, NotificationPriority } from '../../../domain/schemas/notification.schema';

export class GetNotificationsQueryDto {
  @ApiPropertyOptional({
    description: '페이지 번호 (1부터 시작)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  readonly page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지당 아이템 수',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  readonly limit?: number = 20;

  @ApiPropertyOptional({
    description: '읽음 상태 필터 (true: 읽음, false: 안읽음)',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  readonly isRead?: boolean;

  @ApiPropertyOptional({
    description: '알림 유형 필터',
    enum: NotificationType,
    example: NotificationType.TASK_ASSIGNED,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  readonly type?: NotificationType;

  @ApiPropertyOptional({
    description: '알림 우선순위 필터',
    enum: NotificationPriority,
    example: NotificationPriority.HIGH,
  })
  @IsOptional()
  @IsEnum(NotificationPriority)
  readonly priority?: NotificationPriority;

  @ApiPropertyOptional({
    description: '검색 키워드 (제목 또는 내용에서 검색)',
    example: '업무',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  readonly search?: string;
}

export class MarkNotificationAsReadDto {
  @ApiProperty({
    description: '알림 ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  readonly notificationId: string;
}

export class MarkAllNotificationsAsReadDto {
  @ApiPropertyOptional({
    description: '특정 유형의 알림만 읽음 처리 (선택사항)',
    enum: NotificationType,
    example: NotificationType.TASK_ASSIGNED,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  readonly type?: NotificationType;
} 