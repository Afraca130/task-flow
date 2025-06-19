import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ActivityLog } from '../../activity-logs/entities/activity-log.entity';
import { ProjectInvitation } from '../../invitations/entities/project-invitation.entity';
import { Issue } from '../../issues/entities/issue.entity';
import { Task } from '../../tasks/entities/task.entity';
import { User } from '../../users/entities/user.entity';
import { ProjectMember } from './project-member.entity';

export enum ProjectPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Entity('projects')
export class Project extends BaseEntity {

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ type: 'varchar', length: 7, default: '#3B82F6' })
  color: string;

  @Column({
    type: 'enum',
    enum: ProjectPriority,
    default: ProjectPriority.MEDIUM,
  })
  priority: ProjectPriority;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // Relations
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'owner_id' })
  owner?: User;

  @OneToMany(() => ProjectMember, (member) => member.project, { cascade: true })
  members?: ProjectMember[];

  @OneToMany(() => Task, (task) => task.project, { cascade: true })
  tasks?: Task[];

  @OneToMany(() => ActivityLog, (log) => log.project, { cascade: true })
  activityLogs?: ActivityLog[];

  @OneToMany(() => ProjectInvitation, (invitation) => invitation.project, { cascade: true })
  invitations?: ProjectInvitation[];

  @OneToMany(() => Issue, (issue) => issue.project, { cascade: true })
  issues?: Issue[];

  // Virtual fields for counts (not stored in database)
  memberCount?: number;
  taskCount?: number;
}
