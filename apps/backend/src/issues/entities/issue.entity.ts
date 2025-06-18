import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';

export enum IssueStatus {
    OPEN = 'OPEN',
    IN_PROGRESS = 'IN_PROGRESS',
    RESOLVED = 'RESOLVED',
    CLOSED = 'CLOSED',
}

export enum IssuePriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}

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
        enum: IssueStatus,
        default: IssueStatus.OPEN,
    })
    status: IssueStatus;

    @Column({
        type: 'enum',
        enum: IssuePriority,
        default: IssuePriority.MEDIUM,
    })
    priority: IssuePriority;

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

    @Column({ name: 'assignee_id', nullable: true })
    assigneeId?: string;

    @Column({ type: 'simple-array', nullable: true })
    labels?: string[];

    @Column({ name: 'is_pinned', type: 'boolean', default: false })
    isPinned: boolean;

    // Relations
    @ManyToOne(() => Project, (project) => project.issues, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    project?: Project;

    @ManyToOne(() => User, (user) => user.createdIssues, { eager: true })
    @JoinColumn({ name: 'author_id' })
    author?: User;

    @ManyToOne(() => User, (user) => user.assignedIssues, { eager: true })
    @JoinColumn({ name: 'assignee_id' })
    assignee?: User;

    // Domain methods
    public close(): void {
        this.status = IssueStatus.CLOSED;
    }

    public assign(userId: string): void {
        this.assigneeId = userId;
    }

    public unassign(): void {
        this.assigneeId = undefined;
    }

    public pin(): void {
        this.isPinned = true;
    }

    public unpin(): void {
        this.isPinned = false;
    }

    public addLabel(label: string): void {
        if (!this.labels) {
            this.labels = [];
        }
        if (!this.labels.includes(label)) {
            this.labels.push(label);
        }
    }

    public removeLabel(label: string): void {
        if (this.labels) {
            this.labels = this.labels.filter(l => l !== label);
        }
    }

    public updateTitle(title: string): void {
        this.title = title;
    }

    public updateDescription(description: string): void {
        this.description = description;
    }

    public updateStatus(status: IssueStatus): void {
        this.status = status;
    }

    public updatePriority(priority: IssuePriority): void {
        this.priority = priority;
    }

    public updateAssignee(assigneeId: string): void {
        this.assigneeId = assigneeId;
    }

    public updateLabels(labels: string[]): void {
        this.labels = labels;
    }

    public static create(
        title: string,
        description: string,
        authorId: string,
        projectId: string,
        assigneeId?: string,
        priority: IssuePriority = IssuePriority.MEDIUM,
        type: IssueType = IssueType.BUG,
        labels?: string[]
    ): Issue {
        const issue = new Issue();
        issue.title = title;
        issue.description = description;
        issue.authorId = authorId;
        issue.projectId = projectId;
        issue.assigneeId = assigneeId;
        issue.priority = priority;
        issue.type = type;
        issue.labels = labels;
        issue.status = IssueStatus.OPEN;
        issue.isPinned = false;
        return issue;
    }
}
