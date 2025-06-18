import { CreateIssueDto, UpdateIssueDto } from '../dto/request';
import { Issue, IssuePriority, IssueStatus, IssueType } from '../entities/issue.entity';

export interface IssueServiceInterface {
    createIssue(userId: string, createDto: CreateIssueDto): Promise<Issue>;
    updateIssue(userId: string, issueId: string, updateDto: UpdateIssueDto): Promise<Issue>;
    deleteIssue(userId: string, issueId: string): Promise<void>;
    getIssueById(issueId: string): Promise<Issue | null>;
    getIssuesByProject(projectId: string): Promise<Issue[]>;
    getIssuesByAssignee(assigneeId: string): Promise<Issue[]>;
    getIssuesByAuthor(authorId: string): Promise<Issue[]>;
    getAllIssues(): Promise<Issue[]>;
    searchIssues(query: string, projectId?: string): Promise<Issue[]>;
    getIssuesWithFilters(filters: {
        projectId?: string;
        status?: IssueStatus;
        priority?: IssuePriority;
        type?: IssueType;
        assigneeId?: string;
        authorId?: string;
        labels?: string[];
    }): Promise<Issue[]>;
}
