export interface CreateInvitationCommand {
    projectId: string;
    inviterId: string;
    inviteeId: string;
    message?: string;
    expiryDays?: number;
}

export interface AcceptInvitationCommand {
    token: string;
    userId: string;
}

export interface DeclineInvitationCommand {
    token: string;
    userId: string;
}
