import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Issue } from './issue.entity';

@Entity('issue_comments')
export class IssueComment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ name: 'issue_id' })
    issueId: string;

    @Column({ name: 'author_id' })
    authorId: string;

    @Column({ name: 'parent_id', nullable: true })
    parentId?: string;

    @Column({ name: 'is_edited', type: 'boolean', default: false })
    isEdited: boolean;

    @Column({ name: 'like_count', type: 'int', default: 0 })
    likeCount: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Issue, (issue) => issue.comments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'issue_id' })
    issue?: Issue;

    @ManyToOne(() => User, (user) => user.issueComments, { eager: true })
    @JoinColumn({ name: 'author_id' })
    author?: User;

    @ManyToOne(() => IssueComment, { nullable: true })
    @JoinColumn({ name: 'parent_id' })
    parent?: IssueComment;

    // Domain methods
    public edit(newContent: string): void {
        this.content = newContent;
        this.isEdited = true;
    }

    public incrementLikeCount(): void {
        this.likeCount += 1;
    }

    public decrementLikeCount(): void {
        if (this.likeCount > 0) {
            this.likeCount -= 1;
        }
    }
}
