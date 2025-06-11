import { InvitationStatus, ProjectInvitation } from '../../../domain/entities/project-invitation.entity';

export interface CreateInvitationRequest {
    projectId: string;
    inviterId: string;
    inviteeEmail?: string;
    inviteeId?: string;
    message?: string;
    expiryDays?: number;
}

export interface InvitationFilter {
    projectId?: string;
    inviterId?: string;
    inviteeId?: string;
    inviteeEmail?: string;
    status?: InvitationStatus;
    isExpired?: boolean;
}

export interface InvitationPaginationOptions {
    page: number;
    limit: number;
    sortBy?: keyof ProjectInvitation;
    sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedInvitationResult {
    data: ProjectInvitation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export abstract class ProjectInvitationRepositoryPort {
    abstract create(request: CreateInvitationRequest): Promise<ProjectInvitation>;
    abstract findById(id: string): Promise<ProjectInvitation | null>;
    abstract findByToken(token: string): Promise<ProjectInvitation | null>;
    abstract findMany(
        filter: InvitationFilter,
        options: InvitationPaginationOptions,
    ): Promise<PaginatedInvitationResult>;
    abstract findByProjectId(projectId: string): Promise<ProjectInvitation[]>;
    abstract findByInviteeEmail(email: string): Promise<ProjectInvitation[]>;
    abstract findByInviteeId(userId: string): Promise<ProjectInvitation[]>;
    abstract findPendingInvitations(userId: string): Promise<ProjectInvitation[]>;
    abstract update(id: string, updates: Partial<ProjectInvitation>): Promise<ProjectInvitation>;
    abstract delete(id: string): Promise<void>;
    abstract expireOldInvitations(): Promise<number>;
    abstract checkExistingInvitation(
        projectId: string,
        inviteeEmail: string,
    ): Promise<ProjectInvitation | null>;
}
