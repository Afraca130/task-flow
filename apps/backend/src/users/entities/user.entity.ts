import { Column, Entity, OneToMany } from 'typeorm';
import { ActivityLog } from '../../activity-logs/entities/activity-log.entity';
import { BaseEntity } from '../../common/entities/base.entity';
import { TimeUtil } from '../../common/utils/time.util';
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

  @Column({ name: 'profile_image', type: 'varchar', length: 500, nullable: true })
  profileImage?: string;

  @Column({ name: 'profile_color', type: 'varchar', length: 7, default: '#3B82F6' })
  profileColor: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  organization?: string;

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

  @OneToMany(() => Issue, (issue) => issue.assignee)
  assignedIssues?: Issue[];

  // Domain methods
  public updateProfile(name: string, profileImage?: string, profileColor?: string, organization?: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }

    this.name = name.trim();
    if (profileImage !== undefined) {
      this.profileImage = profileImage;
    }
    if (profileColor !== undefined) {
      this.profileColor = profileColor;
    }
    if (organization !== undefined) {
      this.organization = organization;
    }
  }

  public changePassword(newPassword: string): void {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    this.password = newPassword;
  }

  public updateLastLogin(): void {
    this.lastLoginAt = TimeUtil.now();
  }

  public activate(): void {
    this.isActive = true;
  }

  public deactivate(): void {
    this.isActive = false;
  }

  public isAccountActive(): boolean {
    return this.isActive;
  }

  public static create(
    email: string,
    password: string,
    name: string,
    profileImage?: string,
    profileColor?: string,
    organization?: string
  ): User {
    const user = new User();
    user.email = email;
    user.password = password;
    user.name = name;
    user.profileImage = profileImage;
    user.profileColor = profileColor || '#3B82F6'; // Default blue color
    user.organization = organization;
    user.isActive = true;
    return user;
  }
}
