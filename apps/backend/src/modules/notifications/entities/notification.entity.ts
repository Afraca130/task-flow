import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
  TASK_PRIORITY_CHANGED = 'TASK_PRIORITY_CHANGED',
  TASK_DUE_SOON = 'TASK_DUE_SOON',
  TASK_OVERDUE = 'TASK_OVERDUE',
  COMMENT_ADDED = 'COMMENT_ADDED',
  COMMENT_REPLIED = 'COMMENT_REPLIED',
  COMMENT_MENTION = 'COMMENT_MENTION',
  PROJECT_INVITATION = 'PROJECT_INVITATION',
  PROJECT_MEMBER_JOINED = 'PROJECT_MEMBER_JOINED',
  PROJECT_MEMBER_LEFT = 'PROJECT_MEMBER_LEFT',
  PROJECT_STATUS_CHANGED = 'PROJECT_STATUS_CHANGED',
  ISSUE_ASSIGNED = 'ISSUE_ASSIGNED',
  ISSUE_STATUS_CHANGED = 'ISSUE_STATUS_CHANGED',
  ISSUE_MENTION = 'ISSUE_MENTION',
}

@Entity('notifications')
export class Notification extends BaseEntity {
  @ApiProperty({
    description: 'ID of the user who should receive this notification',
    example: 'uuid-v4-string',
    format: 'uuid',
  })
  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.TASK_ASSIGNED,
  })
  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @ApiProperty({
    description: 'Notification title/headline',
    example: '업무 할당',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({
    description: 'Detailed notification message',
    example: 'John님이 "API 개발" 업무를 할당했습니다.',
  })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({
    description: 'Additional data related to the notification (JSON format)',
    example: {
      assignerName: 'John Doe',
      taskTitle: 'API 개발',
      taskId: 'uuid-v4-string'
    },
    nullable: true,
  })
  @Column({ type: 'jsonb', nullable: true })
  data?: any;

  @ApiProperty({
    description: 'Whether the notification has been read by the user',
    example: false,
    default: false,
  })
  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @ApiProperty({
    description: 'Type of the related entity (e.g., "task", "project", "issue")',
    example: 'task',
    nullable: true,
  })
  @Column({ name: 'related_entity_type', nullable: true })
  relatedEntityType?: string;

  @ApiProperty({
    description: 'ID of the related entity',
    example: 'uuid-v4-string',
    format: 'uuid',
    nullable: true,
  })
  @Column({ name: 'related_entity_id', nullable: true })
  relatedEntityId?: string;

  // Relations
  @ApiProperty({
    description: 'User who should receive this notification',
    type: () => User,
  })
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
