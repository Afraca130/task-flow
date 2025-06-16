import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ActivityLog } from '../../activity-logs/entities/activity-log.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { TimeUtil } from '../../common/utils/time.util';
import { ProjectInvitation } from '../../invitations/entities/project-invitation.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { ProjectMember } from '../../projects/entities/project-member.entity';
import { Task } from '../../tasks/entities/task.entity';

/**
 * 사용자 도메인 엔터티
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

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

  // Domain methods
  public updateProfile(name: string, profileImage?: string, profileColor?: string): void {
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

  public hasProfileImage(): boolean {
    return !!this.profileImage;
  }

  public getDisplayName(): string {
    return this.name || this.email;
  }

  public getInitials(): string {
    if (!this.name) return this.email.charAt(0).toUpperCase();

    const nameParts = this.name.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }

    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }

  public static create(email: string, password: string, name: string): User {
    if (!email || !email.includes('@')) {
      throw new Error('Valid email is required');
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (!name || name.trim().length === 0) {
      throw new Error('Name is required');
    }

    const user = new User();
    user.email = email.toLowerCase().trim();
    user.password = password;
    user.name = name.trim();
    user.isActive = true;

    return user;
  }
}
