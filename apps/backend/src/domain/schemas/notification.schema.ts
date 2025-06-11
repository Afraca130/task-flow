import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
  TASK_PRIORITY_CHANGED = 'TASK_PRIORITY_CHANGED',
  TASK_DUE_SOON = 'TASK_DUE_SOON',
  TASK_OVERDUE = 'TASK_OVERDUE',
  TASK_COMPLETED = 'TASK_COMPLETED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  COMMENT_REPLIED = 'COMMENT_REPLIED',
  PROJECT_INVITED = 'PROJECT_INVITED',
  PROJECT_MEMBER_JOINED = 'PROJECT_MEMBER_JOINED',
  PROJECT_MEMBER_LEFT = 'PROJECT_MEMBER_LEFT',
  PROJECT_STATUS_CHANGED = 'PROJECT_STATUS_CHANGED',
  PROJECT_DEADLINE_APPROACHING = 'PROJECT_DEADLINE_APPROACHING',
  MENTION_IN_COMMENT = 'MENTION_IN_COMMENT',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * 알림 액션 - 알림 클릭 시 이동할 페이지 정보
 */
export interface NotificationAction {
  type: 'navigate' | 'modal' | 'external' | 'none';
  url?: string;
  params?: Record<string, any>;
  modal?: string;
  externalUrl?: string;
}

/**
 * 알림 메타데이터 - 추가 정보 저장
 */
export interface NotificationMetadata {
  taskId?: string;
  taskTitle?: string;
  projectId?: string;
  projectName?: string;
  userId?: string;
  userName?: string;
  commentId?: string;
  oldValue?: string;
  newValue?: string;
  dueDate?: Date;
  additionalData?: Record<string, any>;
}

@Schema({ 
  timestamps: true,
  collection: 'notifications',
  versionKey: false,
})
export class Notification extends Document {
  @ApiProperty({
    description: '알림 고유 식별자',
    example: '507f1f77bcf86cd799439011',
  })
  _id: Types.ObjectId;

  @ApiProperty({
    description: '알림 수신자 사용자 ID',
    example: 'user-uuid-123',
  })
  @Prop({ required: true, index: true })
  userId: string;

  @ApiProperty({
    description: '알림 유형',
    enum: NotificationType,
    example: NotificationType.TASK_ASSIGNED,
  })
  @Prop({ 
    required: true, 
    enum: Object.values(NotificationType),
    index: true 
  })
  type: NotificationType;

  @ApiProperty({
    description: '알림 우선순위',
    enum: NotificationPriority,
    example: NotificationPriority.NORMAL,
  })
  @Prop({ 
    required: true, 
    enum: Object.values(NotificationPriority),
    default: NotificationPriority.NORMAL,
    index: true 
  })
  priority: NotificationPriority;

  @ApiProperty({
    description: '알림 제목',
    example: '새 업무가 할당되었습니다',
  })
  @Prop({ required: true, maxlength: 255 })
  title: string;

  @ApiProperty({
    description: '알림 내용',
    example: '홍길동님이 "로그인 기능 구현" 업무를 할당했습니다.',
  })
  @Prop({ required: true, maxlength: 1000 })
  message: string;

  @ApiProperty({
    description: '알림 아이콘 (선택사항)',
    example: 'task-assigned',
  })
  @Prop({ maxlength: 50 })
  icon?: string;

  @ApiProperty({
    description: '읽음 여부',
    example: false,
  })
  @Prop({ default: false, index: true })
  isRead: boolean;

  @ApiProperty({
    description: '읽은 시간',
    example: '2023-12-01T10:30:00Z',
  })
  @Prop({ default: null })
  readAt?: Date;

  @ApiProperty({
    description: '알림 액션 정보',
    example: {
      type: 'navigate',
      url: '/tasks/:taskId',
      params: { taskId: 'task-123' }
    },
  })
  @Prop({ type: Object, default: null })
  action?: NotificationAction;

  @ApiProperty({
    description: '알림 메타데이터',
    example: {
      taskId: 'task-123',
      taskTitle: '로그인 기능 구현',
      projectId: 'project-456',
      userName: '홍길동'
    },
  })
  @Prop({ type: Object, default: null })
  metadata?: NotificationMetadata;

  @ApiProperty({
    description: '알림 만료 시간 (선택사항)',
    example: '2023-12-31T23:59:59Z',
  })
  @Prop({ default: null })
  expiresAt?: Date;

  @ApiProperty({
    description: '알림 생성 시간',
    example: '2023-12-01T09:00:00Z',
  })
  @Prop({ default: Date.now, index: true })
  createdAt: Date;

  @ApiProperty({
    description: '알림 수정 시간',
    example: '2023-12-01T10:30:00Z',
  })
  @Prop({ default: Date.now })
  updatedAt: Date;

  // 인덱스 설정을 위한 정적 메서드
  static createIndexes() {
    return [
      // 사용자별 알림 조회 최적화
      { userId: 1, createdAt: -1 },
      // 읽지 않은 알림 조회 최적화
      { userId: 1, isRead: 1, createdAt: -1 },
      // 알림 유형별 조회 최적화
      { userId: 1, type: 1, createdAt: -1 },
      // 우선순위별 조회 최적화
      { userId: 1, priority: 1, createdAt: -1 },
      // 만료된 알림 정리를 위한 인덱스
      { expiresAt: 1 },
      // 복합 인덱스 - 읽지 않은 알림 개수 조회 최적화
      { userId: 1, isRead: 1, type: 1 },
    ];
  }
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// 복합 인덱스 설정
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, priority: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 알림 타입별 스키마
export type NotificationDocument = Notification & Document; 