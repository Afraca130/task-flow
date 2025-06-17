import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';

export enum ActivityAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  COMMENT = 'COMMENT',
  ASSIGN = 'ASSIGN',
  UNASSIGN = 'UNASSIGN',
  STATUS_CHANGE = 'STATUS_CHANGE',
  PRIORITY_CHANGE = 'PRIORITY_CHANGE',
  JOIN = 'JOIN',
  LEAVE = 'LEAVE',
  INVITE = 'INVITE',
}

export enum EntityType {
  TASK = 'Task',
  PROJECT = 'Project',
  USER = 'User',
  COMMENT = 'Comment',
  PROJECT_MEMBER = 'ProjectMember',
  ISSUE = 'Issue',
}

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({
    name: 'entity_type',
    type: 'enum',
    enum: EntityType,
  })
  entityType: EntityType;

  @Column({
    type: 'enum',
    enum: ActivityAction,
  })
  action: ActivityAction;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;

  // Relations
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Project, (project) => project.activityLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project?: Project;

  // Domain methods
  public isRecent(): boolean {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    return this.timestamp > oneHourAgo;
  }

  public getAgeInMinutes(): number {
    const now = new Date();
    const diffInMs = now.getTime() - this.timestamp.getTime();
    return Math.floor(diffInMs / (1000 * 60));
  }

  public getAgeInHours(): number {
    const now = new Date();
    const diffInMs = now.getTime() - this.timestamp.getTime();
    return Math.floor(diffInMs / (1000 * 60 * 60));
  }

  public getAgeInDays(): number {
    const now = new Date();
    const diffInMs = now.getTime() - this.timestamp.getTime();
    return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  }

  public isTaskRelated(): boolean {
    return this.entityType === EntityType.TASK;
  }

  public isProjectRelated(): boolean {
    return this.entityType === EntityType.PROJECT;
  }

  public isCommentRelated(): boolean {
    return this.entityType === EntityType.COMMENT;
  }

  public getMetadata<T = any>(key: string): T | undefined {
    return this.metadata?.[key] as T;
  }

  public setMetadata(key: string, value: any): void {
    if (!this.metadata) {
      this.metadata = {};
    }
    this.metadata[key] = value;
  }

  public static createTaskCreatedLog(
    userId: string,
    projectId: string,
    taskId: string,
    taskTitle: string
  ): ActivityLog {
    const log = new ActivityLog();
    log.userId = userId;
    log.projectId = projectId;
    log.entityId = taskId;
    log.entityType = EntityType.TASK;
    log.action = ActivityAction.CREATE;
    log.description = `새 업무 "${taskTitle}"를 생성했습니다.`;
    log.metadata = { taskTitle };
    return log;
  }

  public static createTaskAssignedLog(
    userId: string,
    projectId: string,
    taskId: string,
    taskTitle: string,
    assigneeId: string,
    assigneeName: string
  ): ActivityLog {
    const log = new ActivityLog();
    log.userId = userId;
    log.projectId = projectId;
    log.entityId = taskId;
    log.entityType = EntityType.TASK;
    log.action = ActivityAction.ASSIGN;
    log.description = `"${taskTitle}" 업무를 ${assigneeName}님에게 할당했습니다.`;
    log.metadata = { taskTitle, assigneeId, assigneeName };
    return log;
  }

  public static createTaskStatusChangedLog(
    userId: string,
    projectId: string,
    taskId: string,
    taskTitle: string,
    oldStatus: string,
    newStatus: string
  ): ActivityLog {
    const log = new ActivityLog();
    log.userId = userId;
    log.projectId = projectId;
    log.entityId = taskId;
    log.entityType = EntityType.TASK;
    log.action = ActivityAction.STATUS_CHANGE;
    log.description = `"${taskTitle}" 업무 상태를 ${oldStatus}에서 ${newStatus}로 변경했습니다.`;
    log.metadata = { taskTitle, oldStatus, newStatus };
    return log;
  }

  public static createCommentAddedLog(
    userId: string,
    projectId: string,
    commentId: string,
    taskId: string,
    taskTitle: string
  ): ActivityLog {
    const log = new ActivityLog();
    log.userId = userId;
    log.projectId = projectId;
    log.entityId = commentId;
    log.entityType = EntityType.COMMENT;
    log.action = ActivityAction.COMMENT;
    log.description = `"${taskTitle}" 업무에 댓글을 작성했습니다.`;
    log.metadata = { taskId, taskTitle };
    return log;
  }

  public static createProjectMemberJoinedLog(
    userId: string,
    projectId: string,
    memberId: string,
    memberName: string
  ): ActivityLog {
    const log = new ActivityLog();
    log.userId = userId;
    log.projectId = projectId;
    log.entityId = memberId;
    log.entityType = EntityType.PROJECT_MEMBER;
    log.action = ActivityAction.JOIN;
    log.description = `${memberName}님이 프로젝트에 참여했습니다.`;
    log.metadata = { memberId, memberName };
    return log;
  }

  public static createProjectCreatedLog(
    userId: string,
    projectId: string,
    projectName: string
  ): ActivityLog {
    const log = new ActivityLog();
    log.userId = userId;
    log.projectId = projectId;
    log.entityId = projectId;
    log.entityType = EntityType.PROJECT;
    log.action = ActivityAction.CREATE;
    log.description = `새 프로젝트 "${projectName}"를 생성했습니다.`;
    log.metadata = { projectName };
    return log;
  }
}
