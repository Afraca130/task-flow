import { Issue } from '@/issues/entities/issue.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ActivityLog } from '../../activity-logs/entities/activity-log.entity';
import { BaseEntity } from '../../common/entities/base.entity';
import { ProjectInvitation } from '../../invitations/entities/project-invitation.entity';
import { Task } from '../../tasks/entities/task.entity';
import { User } from '../../users/entities/user.entity';
import { ProjectMember } from './project-member.entity';

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum ApprovalType {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
}

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

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.ACTIVE,
  })
  status: ProjectStatus;

  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate?: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'invite_code', type: 'varchar', length: 100, nullable: true })
  inviteCode?: string;

  @Column({
    name: 'approval_type',
    type: 'enum',
    enum: ApprovalType,
    default: ApprovalType.MANUAL,
  })
  approvalType: ApprovalType;

  @Column({ type: 'varchar', length: 7, default: '#3B82F6' })
  color: string;

  @Column({ name: 'icon_url', type: 'varchar', length: 500, nullable: true })
  iconUrl?: string;

  @Column({
    type: 'enum',
    enum: ProjectPriority,
    default: ProjectPriority.MEDIUM,
  })
  priority: ProjectPriority;

  // Relations
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'owner_id' })
  owner?: User;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'created_by' })
  creator?: User;

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

  // Domain methods
  public updateApprovalType(newType: ApprovalType): void {
    this.approvalType = newType;
  }

  public togglePublicStatus(): void {
    this.isPublic = !this.isPublic;
  }

  public generateInviteCode(): string {
    this.inviteCode = this.generateRandomCode();
    return this.inviteCode;
  }

  public updateStatus(newStatus: ProjectStatus): void {
    this.status = newStatus;
  }

  public updateColor(newColor: string): void {
    // Validate HEX color format
    if (!/^#[0-9A-F]{6}$/i.test(newColor)) {
      throw new Error('Invalid color format. Use HEX format (#RRGGBB)');
    }
    this.color = newColor;
  }

  public updatePriority(newPriority: ProjectPriority): void {
    this.priority = newPriority;
  }

  public isActive(): boolean {
    return this.status === ProjectStatus.ACTIVE;
  }

  public isOwner(userId: string): boolean {
    return this.ownerId === userId;
  }

  public canBeModifiedBy(userId: string): boolean {
    return this.isOwner(userId) || this.createdBy === userId;
  }

  private generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
