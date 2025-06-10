import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';
import { TimeUtil } from '../../shared/utils/time.util';

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

/**
 * 프로젝트 초대 도메인 엔터티
 */
@Entity('project_invitations')
export class ProjectInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'inviter_id' })
  inviterId: string;

  @Column({ name: 'invitee_id', nullable: true })
  inviteeId?: string;

  @Column({ name: 'invitee_email', nullable: true })
  inviteeEmail?: string;

  @Column({ type: 'varchar', length: 500, unique: true })
  token: string;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'responded_at', type: 'timestamp', nullable: true })
  respondedAt?: Date;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project?: Project;

  @ManyToOne(() => User, (user) => user.sentInvitations)
  @JoinColumn({ name: 'inviter_id' })
  inviter?: User;

  @ManyToOne(() => User, (user) => user.receivedInvitations, { nullable: true })
  @JoinColumn({ name: 'invitee_id' })
  invitee?: User;

  // Domain methods
  public accept(): void {
    if (this.status !== InvitationStatus.PENDING) {
      throw new Error('Only pending invitations can be accepted');
    }
    if (this.isExpired()) {
      throw new Error('Cannot accept expired invitation');
    }
    this.status = InvitationStatus.ACCEPTED;
    this.respondedAt = TimeUtil.now();
  }

  public decline(): void {
    if (this.status !== InvitationStatus.PENDING) {
      throw new Error('Only pending invitations can be declined');
    }
    this.status = InvitationStatus.DECLINED;
    this.respondedAt = TimeUtil.now();
  }

  public expire(): void {
    if (this.status === InvitationStatus.PENDING) {
      this.status = InvitationStatus.EXPIRED;
      this.respondedAt = TimeUtil.now();
    }
  }

  public isExpired(): boolean {
    return TimeUtil.isAfter(TimeUtil.now(), this.expiresAt) || this.status === InvitationStatus.EXPIRED;
  }

  public isPending(): boolean {
    return this.status === InvitationStatus.PENDING && !this.isExpired();
  }

  public isAccepted(): boolean {
    return this.status === InvitationStatus.ACCEPTED;
  }

  public isDeclined(): boolean {
    return this.status === InvitationStatus.DECLINED;
  }

  public getDaysUntilExpiry(): number {
    if (this.isExpired()) return 0;
    return TimeUtil.diff(this.expiresAt, TimeUtil.now(), 'day');
  }

  public getHoursUntilExpiry(): number {
    if (this.isExpired()) return 0;
    return TimeUtil.diff(this.expiresAt, TimeUtil.now(), 'hour');
  }

  public canResend(): boolean {
    if (this.status !== InvitationStatus.PENDING) return false;
    
    // 마지막 전송 후 1시간이 지났는지 확인
    const oneHourAgo = TimeUtil.subtract(TimeUtil.now(), 1, 'hour');
    return TimeUtil.isBefore(this.createdAt, oneHourAgo);
  }

  public extendExpiry(days: number = 7): void {
    if (this.status !== InvitationStatus.PENDING) {
      throw new Error('Can only extend pending invitations');
    }
    
    this.expiresAt = TimeUtil.add(TimeUtil.now(), days, 'day');
  }

  public static create(
    projectId: string,
    inviterId: string,
    inviteeEmail: string,
    message?: string,
    expiryDays: number = 7
  ): ProjectInvitation {
    const invitation = new ProjectInvitation();
    invitation.projectId = projectId;
    invitation.inviterId = inviterId;
    invitation.inviteeEmail = inviteeEmail;
    invitation.message = message;
    invitation.status = InvitationStatus.PENDING;
    
    // 만료일 설정 (기본 7일)
    invitation.expiresAt = TimeUtil.add(TimeUtil.now(), expiryDays, 'day');
    
    // 토큰 생성
    invitation.token = invitation.generateToken();
    
    return invitation;
  }

  public static createForUser(
    projectId: string,
    inviterId: string,
    inviteeId: string,
    message?: string,
    expiryDays: number = 7
  ): ProjectInvitation {
    const invitation = new ProjectInvitation();
    invitation.projectId = projectId;
    invitation.inviterId = inviterId;
    invitation.inviteeId = inviteeId;
    invitation.message = message;
    invitation.status = InvitationStatus.PENDING;
    
    // 만료일 설정 (기본 7일)
    invitation.expiresAt = TimeUtil.add(TimeUtil.now(), expiryDays, 'day');
    
    // 토큰 생성
    invitation.token = invitation.generateToken();
    
    return invitation;
  }

  private generateToken(): string {
    const timestamp = TimeUtil.now().getTime().toString();
    const random = Math.random().toString(36).substring(2);
    return `${timestamp}-${random}`;
  }
} 