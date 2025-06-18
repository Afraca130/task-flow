import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';

export enum IssueType {
    BUG = 'BUG',
    FEATURE = 'FEATURE',
    IMPROVEMENT = 'IMPROVEMENT',
    QUESTION = 'QUESTION',
    DISCUSSION = 'DISCUSSION',
}

@Entity('issues')
export class Issue extends BaseEntity {

    @Column({ length: 200 })
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({
        type: 'enum',
        enum: IssueType,
        default: IssueType.BUG,
    })
    type: IssueType;

    @Column({ name: 'project_id' })
    projectId: string;

    @Column({ name: 'author_id' })
    authorId: string;

    // Relations
    @ManyToOne(() => Project, (project) => project.issues, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    project?: Project;

    @ManyToOne(() => User, (user) => user.createdIssues, { eager: true })
    @JoinColumn({ name: 'author_id' })
    author?: User;

    // Domain methods
    public updateTitle(title: string): void {
        this.title = title;
    }

    public updateDescription(description: string): void {
        this.description = description;
    }

    public updateType(type: IssueType): void {
        this.type = type;
    }

    public static create(
        title: string,
        description: string,
        authorId: string,
        projectId: string,
        type: IssueType = IssueType.BUG
    ): Issue {
        const issue = new Issue();
        issue.title = title;
        issue.description = description;
        issue.authorId = authorId;
        issue.projectId = projectId;
        issue.type = type;
        return issue;
    }
}
