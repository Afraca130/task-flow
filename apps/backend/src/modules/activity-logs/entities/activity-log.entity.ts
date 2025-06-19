import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';

export enum EntityType {
  TASK = 'Task',
  PROJECT = 'Project',
  USER = 'User',
  COMMENT = 'Comment',
  PROJECT_MEMBER = 'ProjectMember',
  ISSUE = 'Issue',
}

export enum ActivityAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ASSIGN = 'ASSIGN',
  UNASSIGN = 'UNASSIGN',
  STATUS_CHANGE = 'STATUS_CHANGE',
  PRIORITY_CHANGE = 'PRIORITY_CHANGE',
  JOIN = 'JOIN',
  LEAVE = 'LEAVE',
}

@Entity('activity_logs')
export class ActivityLog extends BaseEntity {
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

  // Relations
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Project, (project) => project.activityLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project?: Project;
}
