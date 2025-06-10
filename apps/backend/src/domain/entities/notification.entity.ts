import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Task } from './task.entity';
import { Project } from './project.entity';
import { TimeUtil } from '../../shared/utils/time.util';

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
  TASK_PRIORITY_CHANGED = 'TASK_PRIORITY_CHANGED',
  TASK_DUE_SOON = 'TASK_DUE_SOON',
  TASK_OVERDUE = 'TASK_OVERDUE',
  COMMENT_ADDED = 'COMMENT_ADDED',
  COMMENT_REPLIED = 'COMMENT_REPLIED',
  PROJECT_INVITED = 'PROJECT_INVITED',
  PROJECT_MEMBER_JOINED = 'PROJECT_MEMBER_JOINED',
  PROJECT_MEMBER_LEFT = 'PROJECT_MEMBER_LEFT',
  PROJECT_STATUS_CHANGED = 'PROJECT_STATUS_CHANGED',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'task_id', nullable: true })
  taskId?: string;

  @Column({ name: 'project_id', nullable: true })
  projectId?: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'json', nullable: true })
  data?: any;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Task, (task) => task.notifications, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task?: Task;

  @ManyToOne(() => Project, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project?: Project;

  // Domain methods
  public markAsRead(): void {
    if (!this.isRead) {
      this.isRead = true;
      this.readAt = TimeUtil.now();
    }
  }

  public markAsUnread(): void {
    this.isRead = false;
    this.readAt = undefined;
  }

  public isRecent(): boolean {
    const oneDayAgo = TimeUtil.subtract(TimeUtil.now(), 1, 'day');
    return TimeUtil.isAfter(this.createdAt, oneDayAgo);
  }

  public getAgeInHours(): number {
    const now = TimeUtil.now();
    const diffInMs = now.getTime() - this.createdAt.getTime();
    return Math.floor(diffInMs / (1000 * 60 * 60));
  }

  public getAgeInDays(): number {
    const now = TimeUtil.now();
    const diffInMs = now.getTime() - this.createdAt.getTime();
    return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  }

  public static createTaskAssignedNotification(
    userId: string,
    taskId: string,
    taskTitle: string,
    assignerName: string
  ): Notification {
    const notification = new Notification();
    notification.userId = userId;
    notification.taskId = taskId;
    notification.type = NotificationType.TASK_ASSIGNED;
    notification.title = '새 업무가 할당되었습니다';
    notification.message = `${assignerName}님이 "${taskTitle}" 업무를 할당했습니다.`;
    return notification;
  }

  public static createTaskStatusChangedNotification(
    userId: string,
    taskId: string,
    taskTitle: string,
    newStatus: string,
    changerName: string
  ): Notification {
    const notification = new Notification();
    notification.userId = userId;
    notification.taskId = taskId;
    notification.type = NotificationType.TASK_STATUS_CHANGED;
    notification.title = '업무 상태가 변경되었습니다';
    notification.message = `${changerName}님이 "${taskTitle}" 업무 상태를 ${newStatus}로 변경했습니다.`;
    return notification;
  }

  public static createCommentAddedNotification(
    userId: string,
    taskId: string,
    taskTitle: string,
    commenterName: string
  ): Notification {
    const notification = new Notification();
    notification.userId = userId;
    notification.taskId = taskId;
    notification.type = NotificationType.COMMENT_ADDED;
    notification.title = '새 댓글이 추가되었습니다';
    notification.message = `${commenterName}님이 "${taskTitle}" 업무에 댓글을 작성했습니다.`;
    return notification;
  }

  public static createProjectInvitedNotification(
    userId: string,
    projectId: string,
    projectName: string,
    inviterName: string
  ): Notification {
    const notification = new Notification();
    notification.userId = userId;
    notification.projectId = projectId;
    notification.type = NotificationType.PROJECT_INVITED;
    notification.title = '프로젝트에 초대되었습니다';
    notification.message = `${inviterName}님이 "${projectName}" 프로젝트에 초대했습니다.`;
    return notification;
  }

  public static createTaskDueSoonNotification(
    userId: string,
    taskId: string,
    taskTitle: string,
    dueDate: Date
  ): Notification {
    const notification = new Notification();
    notification.userId = userId;
    notification.taskId = taskId;
    notification.type = NotificationType.TASK_DUE_SOON;
    notification.title = '업무 마감일이 다가옵니다';
    notification.message = `"${taskTitle}" 업무의 마감일(${dueDate.toLocaleDateString()})이 다가옵니다.`;
    return notification;
  }
} 