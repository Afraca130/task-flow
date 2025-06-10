import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { ProjectMember } from './project-member.entity';
import { Task } from './task.entity';
import { ActivityLog } from './activity-log.entity';
import { ProjectInvitation } from './project-invitation.entity';

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum ApprovalType {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

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