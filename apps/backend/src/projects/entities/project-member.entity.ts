import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { TimeUtil } from '../../common/utils/time.util';

export enum ProjectMemberRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  MEMBER = 'MEMBER',
}

@Entity('project_members')
export class ProjectMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: ProjectMemberRole,
    default: ProjectMemberRole.MEMBER,
  })
  role: ProjectMemberRole;

  @Column({ name: 'joined_at', type: 'timestamp', nullable: true })
  joinedAt?: Date;

  @Column({ name: 'invited_by', nullable: true })
  invitedBy?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Project, (project) => project.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project?: Project;

  @ManyToOne(() => User, (user) => user.projectMemberships, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'invited_by' })
  inviter?: User;

  // Domain methods
  public isOwner(): boolean {
    return this.role === ProjectMemberRole.OWNER;
  }

  public isManager(): boolean {
    return this.role === ProjectMemberRole.MANAGER;
  }

  public isMember(): boolean {
    return this.role === ProjectMemberRole.MEMBER;
  }

  public hasManagementPermissions(): boolean {
    return this.isOwner() || this.isManager();
  }

  public canManageMembers(): boolean {
    return this.isOwner() || this.isManager();
  }

  public canModifyProject(): boolean {
    return this.isOwner() || this.isManager();
  }

  public canDeleteProject(): boolean {
    return this.isOwner();
  }

  public changeRole(newRole: ProjectMemberRole): void {
    if (this.role === ProjectMemberRole.OWNER && newRole !== ProjectMemberRole.OWNER) {
      throw new Error('Cannot change owner role without transferring ownership');
    }
    this.role = newRole;
  }

  public activate(): void {
    this.isActive = true;
    if (!this.joinedAt) {
      this.joinedAt = TimeUtil.now();
    }
  }

  public deactivate(): void {
    this.isActive = false;
  }

  public static createOwner(projectId: string, userId: string): ProjectMember {
    const member = new ProjectMember();
    member.projectId = projectId;
    member.userId = userId;
    member.role = ProjectMemberRole.OWNER;
    member.isActive = true;
    member.joinedAt = TimeUtil.now();
    return member;
  }

  public static createMember(projectId: string, userId: string, invitedBy?: string): ProjectMember {
    const member = new ProjectMember();
    member.projectId = projectId;
    member.userId = userId;
    member.role = ProjectMemberRole.MEMBER;
    member.isActive = true;
    member.joinedAt = TimeUtil.now();
    member.invitedBy = invitedBy;
    return member;
  }
} 