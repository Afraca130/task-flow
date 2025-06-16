import { InvitationStatus, ProjectInvitation } from "../entities/project-invitation.entity";

/**
 * 초대 생성 요청
 */
export interface CreateInvitationRequest {
    projectId: string;
    inviterId: string;
    inviteeEmail: string;
    inviteeId?: string;
    role?: string;
    message?: string;
    expiryDays?: number;
}

/**
 * 초대 필터
 */
export interface InvitationFilter {
    projectId?: string;
    inviterId?: string;
    inviteeId?: string;
    inviteeEmail?: string;
    status?: InvitationStatus;
    isExpired?: boolean;
    startDate?: Date;
    endDate?: Date;
}

/**
 * 초대 페이지네이션 옵션
 */
export interface InvitationPaginationOptions {
    page: number;
    limit: number;
    sortBy?: 'createdAt' | 'status';
    sortOrder?: 'ASC' | 'DESC';
}

/**
 * 페이지네이션된 초대 결과
 */
export interface PaginatedInvitationResult {
    data: ProjectInvitation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/**
 * 프로젝트 초대 리포지토리 포트
 */
export interface ProjectInvitationRepositoryPort {
    /**
     * 초대 생성
     */
    create(request: CreateInvitationRequest): Promise<ProjectInvitation>;

    /**
     * ID로 초대 조회
     */
    findById(id: string): Promise<ProjectInvitation | null>;

    /**
     * 토큰으로 초대 조회
     */
    findByToken(token: string): Promise<ProjectInvitation | null>;

    /**
     * 이메일과 프로젝트로 초대 조회
     */
    // findByEmailAndProject(email: string, projectId: string): Promise<ProjectInvitation | null>;

    /**
     * 기존 초대 확인 (호환성)
     */
    checkExistingInvitation(projectId: string, inviteeEmail: string): Promise<ProjectInvitation | null>;

    /**
     * 프로젝트별 초대 목록 조회
     */
    findByProjectId(
        projectId: string,
        options?: InvitationPaginationOptions
    ): Promise<PaginatedInvitationResult | ProjectInvitation[]>;

    /**
     * 사용자별 초대 목록 조회 (이메일)
     */
    findByInviteeEmail(
        email: string,
        options?: InvitationPaginationOptions
    ): Promise<ProjectInvitation[]>;

    /**
     * 사용자별 초대 목록 조회 (ID)
     */
    findByInviteeId(userId: string): Promise<ProjectInvitation[]>;

    /**
     * 대기 중인 초대 조회
     */
    findPendingInvitations(userId: string): Promise<ProjectInvitation[]>;

    /**
     * 필터링된 초대 목록 조회
     */
    // findWithFilter(
    //     filter: InvitationFilter,
    //     options: InvitationPaginationOptions
    // ): Promise<PaginatedInvitationResult>;

    /**
     * 많은 조건으로 조회 (기존 호환성) - 두 개의 파라미터
     */
    findMany(
        filter: InvitationFilter,
        options: InvitationPaginationOptions
    ): Promise<PaginatedInvitationResult>;

    /**
     * 초대 업데이트
     */
    update(id: string, data: Partial<ProjectInvitation>): Promise<ProjectInvitation>;

    /**
     * 초대 삭제
     */
    delete(id: string): Promise<void>;

    /**
     * 만료된 초대 정리
     */
    // deleteExpiredInvitations(): Promise<number>;
}
