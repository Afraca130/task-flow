import { Column, Entity, OneToMany } from 'typeorm';
import { ActivityLog } from '../../activity-logs/entities/activity-log.entity';
import { BaseEntity } from '../../common/entities/base.entity';
import { ProjectInvitation } from '../../invitations/entities/project-invitation.entity';
import { Issue } from '../../issues/entities/issue.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { ProjectMember } from '../../projects/entities/project-member.entity';
import { Comment } from '../../tasks/comments/entities/comment.entity';
import { Task } from '../../tasks/entities/task.entity';

/**
 * 사용자 도메인 엔터티
 */
@Entity('users')
export class User extends BaseEntity {

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'profile_color', type: 'varchar', length: 7, default: '#3B82F6' })
  profileColor: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  // Relations
  @OneToMany(() => ProjectMember, (member) => member.user, { cascade: true })
  projectMemberships?: ProjectMember[];

  @OneToMany(() => Task, (task) => task.assignee)
  assignedTasks?: Task[];

  @OneToMany(() => Task, (task) => task.assigner)
  createdTasks?: Task[];

  @OneToMany(() => Comment, (comment) => comment.user, { cascade: true })
  comments?: Comment[];

  @OneToMany(() => ActivityLog, (log) => log.user, { cascade: true })
  activityLogs?: ActivityLog[];

  @OneToMany(() => Notification, (notification) => notification.user, { cascade: true })
  notifications?: Notification[];

  @OneToMany(() => ProjectInvitation, (invitation) => invitation.inviter)
  sentInvitations?: ProjectInvitation[];

  @OneToMany(() => ProjectInvitation, (invitation) => invitation.invitee)
  receivedInvitations?: ProjectInvitation[];

  @OneToMany(() => Issue, (issue) => issue.author)
  createdIssues?: Issue[];
}
