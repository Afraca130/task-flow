import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { NotificationType, NotificationPriority, NotificationAction, NotificationMetadata } from '../../../domain/schemas/notification.schema';

@Exclude()
export class NotificationResponseDto {
  @ApiProperty({
    description: '알림 고유 식별자',
    example: '507f1f77bcf86cd799439011',
  })
  @Expose()
  @Transform(({ value }) => value?.toString())
  readonly id: string;

  @ApiProperty({
    description: '알림 수신자 사용자 ID',
    example: 'user-uuid-123',
  })
  @Expose()
  readonly userId: string;

  @ApiProperty({
    description: '알림 유형',
    enum: NotificationType,
    example: NotificationType.TASK_ASSIGNED,
  })
  @Expose()
  readonly type: NotificationType;

  @ApiProperty({
    description: '알림 우선순위',
    enum: NotificationPriority,
    example: NotificationPriority.NORMAL,
  })
  @Expose()
  readonly priority: NotificationPriority;

  @ApiProperty({
    description: '알림 제목',
    example: '새 업무가 할당되었습니다',
  })
  @Expose()
  readonly title: string;

  @ApiProperty({
    description: '알림 내용',
    example: '홍길동님이 "로그인 기능 구현" 업무를 할당했습니다.',
  })
  @Expose()
  readonly message: string;

  @ApiPropertyOptional({
    description: '알림 아이콘',
    example: 'task-assigned',
  })
  @Expose()
  readonly icon?: string;

  @ApiProperty({
    description: '읽음 여부',
    example: false,
  })
  @Expose()
  readonly isRead: boolean;

  @ApiPropertyOptional({
    description: '읽은 시간',
    example: '2023-12-01T10:30:00Z',
  })
  @Expose()
  readonly readAt?: Date;

  @ApiPropertyOptional({
    description: '알림 액션 정보',
    example: {
      type: 'navigate',
      url: '/tasks/:taskId',
      params: { taskId: 'task-123' }
    },
  })
  @Expose()
  readonly action?: NotificationAction;

  @ApiPropertyOptional({
    description: '알림 메타데이터',
    example: {
      taskId: 'task-123',
      taskTitle: '로그인 기능 구현',
      projectId: 'project-456',
      userName: '홍길동'
    },
  })
  @Expose()
  readonly metadata?: NotificationMetadata;

  @ApiProperty({
    description: '알림 생성 시간',
    example: '2023-12-01T09:00:00Z',
  })
  @Expose()
  readonly createdAt: Date;

  @ApiProperty({
    description: '상대적 시간 (예: "2시간 전")',
    example: '2시간 전',
  })
  @Expose()
  readonly relativeTime: string;

  constructor(partial: Partial<NotificationResponseDto>) {
    Object.assign(this, partial);
  }

  static fromDocument(notification: any): NotificationResponseDto {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(notification.createdAt).getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    let relativeTime: string;
    if (diffInMinutes < 1) {
      relativeTime = '방금 전';
    } else if (diffInMinutes < 60) {
      relativeTime = `${diffInMinutes}분 전`;
    } else if (diffInHours < 24) {
      relativeTime = `${diffInHours}시간 전`;
    } else if (diffInDays < 7) {
      relativeTime = `${diffInDays}일 전`;
    } else {
      relativeTime = new Date(notification.createdAt).toLocaleDateString('ko-KR');
    }

    return new NotificationResponseDto({
      id: notification._id?.toString() || notification.id,
      userId: notification.userId,
      type: notification.type,
      priority: notification.priority,
      title: notification.title,
      message: notification.message,
      icon: notification.icon,
      isRead: notification.isRead,
      readAt: notification.readAt,
      action: notification.action,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
      relativeTime,
    });
  }
}

@Exclude()
export class NotificationSummaryResponseDto {
  @ApiProperty({
    description: '총 알림 개수',
    example: 45,
  })
  @Expose()
  readonly totalCount: number;

  @ApiProperty({
    description: '읽지 않은 알림 개수',
    example: 12,
  })
  @Expose()
  readonly unreadCount: number;

  @ApiProperty({
    description: '높은 우선순위 알림 개수',
    example: 3,
  })
  @Expose()
  readonly highPriorityCount: number;

  @ApiProperty({
    description: '긴급 알림 개수',
    example: 1,
  })
  @Expose()
  readonly urgentCount: number;

  @ApiProperty({
    description: '유형별 알림 개수',
    example: {
      TASK_ASSIGNED: 5,
      COMMENT_ADDED: 3,
      PROJECT_INVITED: 2
    },
  })
  @Expose()
  readonly countByType: Record<NotificationType, number>;

  constructor(partial: Partial<NotificationSummaryResponseDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class PaginatedNotificationResponseDto {
  @ApiProperty({
    description: '알림 목록',
    type: [NotificationResponseDto],
  })
  @Expose()
  readonly data: NotificationResponseDto[];

  @ApiProperty({
    description: '페이지네이션 메타데이터',
    example: {
      page: 1,
      limit: 20,
      total: 100,
      totalPages: 5,
      hasNext: true,
      hasPrevious: false
    },
  })
  @Expose()
  readonly meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };

  constructor(partial: Partial<PaginatedNotificationResponseDto>) {
    Object.assign(this, partial);
  }

  static create(
    notifications: any[],
    page: number,
    limit: number,
    total: number
  ): PaginatedNotificationResponseDto {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return new PaginatedNotificationResponseDto({
      data: notifications.map(notification => NotificationResponseDto.fromDocument(notification)),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrevious,
      },
    });
  }
} 