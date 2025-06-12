import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TimeUtil } from '../../shared/utils/time.util';
import { Comment } from './comment.entity';
import { Notification } from './notification.entity';
import { Project } from './project.entity';
import { User } from './user.entity';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * 작업 도메인 엔터티
 */
@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId?: string;

  @Column({ name: 'assigner_id' })
  assignerId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate?: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ name: 'estimated_hours', type: 'decimal', precision: 5, scale: 2, nullable: true })
  estimatedHours?: number;

  @Column({ name: 'actual_hours', type: 'decimal', precision: 5, scale: 2, nullable: true })
  actualHours?: number;

  @Column({ type: 'json', nullable: true })
  tags?: string[];

  @Column({ name: 'lexo_rank', type: 'varchar', length: 50, default: 'U' })
  lexoRank: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project?: Project;

  @ManyToOne(() => User, (user) => user.assignedTasks, { nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee?: User;

  @ManyToOne(() => User, (user) => user.createdTasks)
  @JoinColumn({ name: 'assigner_id' })
  assigner?: User;

  @OneToMany(() => Comment, (comment) => comment.task, { cascade: true })
  comments?: Comment[];

  @OneToMany(() => Notification, (notification) => notification.task, { cascade: true })
  notifications?: Notification[];

  // Domain methods
  public assignTo(userId: string): void {
    this.assigneeId = userId;
  }

  public unassign(): void {
    this.assigneeId = undefined;
  }

  public updateStatus(newStatus: TaskStatus): void {
    const oldStatus = this.status;
    this.status = newStatus;

    if (newStatus === TaskStatus.COMPLETED && oldStatus !== TaskStatus.COMPLETED) {
      this.completedAt = TimeUtil.now();
    } else if (newStatus !== TaskStatus.COMPLETED) {
      this.completedAt = undefined;
    }
  }

  public updatePriority(newPriority: TaskPriority): void {
    this.priority = newPriority;
  }

  public setDueDate(dueDate: Date): void {
    this.dueDate = dueDate;
  }

  public removeDueDate(): void {
    this.dueDate = undefined;
  }

  public updateEstimatedHours(hours: number): void {
    if (hours < 0) {
      throw new Error('Estimated hours cannot be negative');
    }
    this.estimatedHours = hours;
  }

  public updateActualHours(hours: number): void {
    if (hours < 0) {
      throw new Error('Actual hours cannot be negative');
    }
    this.actualHours = hours;
  }

  public addTag(tag: string): void {
    if (!this.tags) {
      this.tags = [];
    }
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  public removeTag(tag: string): void {
    if (this.tags) {
      this.tags = this.tags.filter(t => t !== tag);
    }
  }

  public isCompleted(): boolean {
    return this.status === TaskStatus.COMPLETED;
  }

  public isInProgress(): boolean {
    return this.status === TaskStatus.IN_PROGRESS;
  }

  public isTodo(): boolean {
    return this.status === TaskStatus.TODO;
  }

  public isOverdue(): boolean {
    return !!this.dueDate && TimeUtil.isAfter(TimeUtil.now(), this.dueDate) && !this.isCompleted();
  }

  public isDueSoon(hours: number = 24): boolean {
    if (!this.dueDate || this.isCompleted()) return false;

    const soonThreshold = TimeUtil.add(TimeUtil.now(), hours, 'hour');
    return TimeUtil.isBefore(this.dueDate, soonThreshold);
  }

  public getDaysUntilDue(): number | null {
    if (!this.dueDate) return null;
    return TimeUtil.diff(this.dueDate, TimeUtil.now(), 'day');
  }

  public getHoursUntilDue(): number | null {
    if (!this.dueDate) return null;
    return TimeUtil.diff(this.dueDate, TimeUtil.now(), 'hour');
  }

  public isAssignedTo(userId: string): boolean {
    return this.assigneeId === userId;
  }

  public isCreatedBy(userId: string): boolean {
    return this.assignerId === userId;
  }

  public hasTag(tag: string): boolean {
    return !!this.tags && this.tags.includes(tag);
  }

  public getProgressPercentage(): number {
    if (this.isCompleted()) return 100;
    if (this.isInProgress()) return 50;
    return 0;
  }

  public static create(
    projectId: string,
    assignerId: string,
    title: string,
    description?: string,
    assigneeId?: string,
    lexoRank?: string
  ): Task {
    if (!title || title.trim().length === 0) {
      throw new Error('Task title is required');
    }

    const task = new Task();
    task.projectId = projectId;
    task.assignerId = assignerId;
    task.assigneeId = assigneeId;
    task.title = title.trim();
    task.description = description?.trim();
    task.status = TaskStatus.TODO;
    task.priority = TaskPriority.MEDIUM;
    task.lexoRank = lexoRank || 'U';

    return task;
  }
}
