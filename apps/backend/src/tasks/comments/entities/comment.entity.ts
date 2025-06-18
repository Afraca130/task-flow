import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../../users/entities/user.entity';
import { Task } from '../../entities/task.entity';

@Entity('comments')
export class Comment extends BaseEntity {
  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'task_id' })
  taskId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'parent_id', nullable: true })
  parentId?: string;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  // Relations
  @ManyToOne(() => Task, (task) => task.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task?: Task;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Comment, (comment) => comment.replies, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: Comment;

  @OneToMany(() => Comment, (comment) => comment.parent, { cascade: true })
  replies?: Comment[];

  // Domain methods
  public updateContent(newContent: string): void {
    if (!newContent || newContent.trim().length === 0) {
      throw new Error('Comment content cannot be empty');
    }
    this.content = newContent.trim();
  }

  public markAsDeleted(): void {
    this.isDeleted = true;
    this.content = '[삭제된 댓글입니다]';
  }

  public restore(): void {
    this.isDeleted = false;
  }

  public isReply(): boolean {
    return !!this.parentId;
  }

  public hasReplies(): boolean {
    return this.replies && this.replies.length > 0;
  }

  public canBeEditedBy(userId: string): boolean {
    return this.userId === userId && !this.isDeleted;
  }

  public canBeDeletedBy(userId: string): boolean {
    return this.userId === userId && !this.isDeleted;
  }

  public getDisplayContent(): string {
    return this.isDeleted ? '[삭제된 댓글입니다]' : this.content;
  }

  public static createComment(taskId: string, userId: string, content: string, parentId?: string): Comment {
    if (!content || content.trim().length === 0) {
      throw new Error('Comment content cannot be empty');
    }

    const comment = new Comment();
    comment.taskId = taskId;
    comment.userId = userId;
    comment.content = content.trim();
    comment.parentId = parentId;
    comment.isDeleted = false;
    return comment;
  }
}
