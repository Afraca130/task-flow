import { Filter, PaginatedResult, PaginationOptions } from '../../../common/interfaces/pagination.interface';
import { InvitationStatus, ProjectInvitation } from '../entities/project-invitation.entity';

export interface CreateInvitationRequest {
    projectId: string;
    inviterId: string;
    inviteeId: string;
    message?: string;
    expiryDays?: number;
}

export interface InvitationFilter extends Filter {
    projectId?: string;
    inviterId?: string;
    inviteeId?: string;
    status?: InvitationStatus;
    isExpired?: boolean;
}

export interface InvitationPaginationOptions extends PaginationOptions {
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedInvitationResult extends PaginatedResult<ProjectInvitation> { }
