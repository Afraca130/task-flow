import {
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    Param,
    Post,
    Put,
    Query,
    Req,
    UseGuards
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiTags,
    ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Request } from 'express';
import {
    InvitationFilter,
    InvitationPaginationOptions,
    ProjectInvitationRepositoryPort,
} from '../../application/ports/output/project-invitation-repository.port';
import { AcceptInvitationCommand, AcceptInvitationUseCase } from '../../application/use-cases/invitation/accept-invitation.use-case';
import { CreateInvitationCommand, CreateInvitationUseCase } from '../../application/use-cases/invitation/create-invitation.use-case';
import { DeclineInvitationCommand, DeclineInvitationUseCase } from '../../application/use-cases/invitation/decline-invitation.use-case';
import { InvitationStatus } from '../../domain/entities/project-invitation.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

// DTOs
class CreateInvitationDto {
    projectId: string;
    inviteeEmail?: string;
    inviteeId?: string;
    message?: string;
    expiryDays?: number;
}

class AcceptInvitationDto {
    token: string;
}

class DeclineInvitationDto {
    token: string;
}

@ApiTags('invitations')
@Controller({ path: 'invitations', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class InvitationController {
    constructor(
        private readonly createInvitationUseCase: CreateInvitationUseCase,
        private readonly acceptInvitationUseCase: AcceptInvitationUseCase,
        private readonly declineInvitationUseCase: DeclineInvitationUseCase,
        @Inject('ProjectInvitationRepositoryPort')
        private readonly invitationRepository: ProjectInvitationRepositoryPort,
    ) { }

    @Post()
    @ApiOperation({
        summary: '프로젝트 초대 생성',
        description: '새로운 프로젝트 초대를 생성합니다.',
    })
    @ApiCreatedResponse({ description: '초대가 성공적으로 생성됨' })
    @ApiBadRequestResponse({ description: '잘못된 요청 데이터' })
    @ApiUnauthorizedResponse({ description: '인증 실패' })
    @ApiNotFoundResponse({ description: '프로젝트 또는 사용자를 찾을 수 없음' })
    async createInvitation(
        @Body() dto: CreateInvitationDto,
        @Req() req: Request,
    ) {
        const userId = (req as any).user?.id;

        const command: CreateInvitationCommand = {
            projectId: dto.projectId,
            inviterId: userId,
            inviteeEmail: dto.inviteeEmail,
            inviteeId: dto.inviteeId,
            message: dto.message,
            expiryDays: dto.expiryDays,
        };

        return this.createInvitationUseCase.execute(command);
    }

    @Put(':token/accept')
    @ApiOperation({
        summary: '초대 수락',
        description: '프로젝트 초대를 수락합니다.',
    })
    @ApiParam({ name: 'token', description: '초대 토큰' })
    @ApiOkResponse({ description: '초대가 성공적으로 수락됨' })
    @ApiBadRequestResponse({ description: '초대가 만료되었거나 이미 처리됨' })
    @ApiUnauthorizedResponse({ description: '인증 실패' })
    @ApiNotFoundResponse({ description: '초대를 찾을 수 없음' })
    async acceptInvitation(
        @Param('token') token: string,
        @Req() req: Request,
    ) {
        const userId = (req as any).user?.id;

        const command: AcceptInvitationCommand = {
            token,
            userId,
        };

        return this.acceptInvitationUseCase.execute(command);
    }

    @Put(':token/decline')
    @ApiOperation({
        summary: '초대 거절',
        description: '프로젝트 초대를 거절합니다.',
    })
    @ApiParam({ name: 'token', description: '초대 토큰' })
    @ApiOkResponse({ description: '초대가 성공적으로 거절됨' })
    @ApiBadRequestResponse({ description: '초대가 만료되었거나 이미 처리됨' })
    @ApiUnauthorizedResponse({ description: '인증 실패' })
    @ApiNotFoundResponse({ description: '초대를 찾을 수 없음' })
    async declineInvitation(
        @Param('token') token: string,
        @Req() req: Request,
    ) {
        const userId = (req as any).user?.id;

        const command: DeclineInvitationCommand = {
            token,
            userId,
        };

        return this.declineInvitationUseCase.execute(command);
    }

    @Get(':token')
    @ApiOperation({
        summary: '초대 정보 조회',
        description: '토큰으로 초대 정보를 조회합니다.',
    })
    @ApiParam({ name: 'token', description: '초대 토큰' })
    @ApiOkResponse({ description: '초대 정보 조회 성공' })
    @ApiNotFoundResponse({ description: '초대를 찾을 수 없음' })
    async getInvitationByToken(@Param('token') token: string) {
        return this.invitationRepository.findByToken(token);
    }

    @Get('project/:projectId')
    @ApiOperation({
        summary: '프로젝트 초대 목록 조회',
        description: '특정 프로젝트의 초대 목록을 조회합니다.',
    })
    @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
    @ApiOkResponse({ description: '프로젝트 초대 목록 조회 성공' })
    async getProjectInvitations(@Param('projectId') projectId: string) {
        return this.invitationRepository.findByProjectId(projectId);
    }

    @Get('user/received')
    @ApiOperation({
        summary: '받은 초대 목록 조회',
        description: '사용자가 받은 초대 목록을 조회합니다.',
    })
    @ApiQuery({ name: 'status', enum: InvitationStatus, required: false })
    @ApiOkResponse({ description: '받은 초대 목록 조회 성공' })
    async getReceivedInvitations(
        @Req() req: Request,
        @Query('status') status?: InvitationStatus,
    ) {
        const userId = (req as any).user?.id;
        const userEmail = (req as any).user?.email;

        if (status) {
            const filter: InvitationFilter = {
                status,
            };
            const options: InvitationPaginationOptions = {
                page: 1,
                limit: 100,
            };

            // 사용자 ID 또는 이메일로 검색
            const invitationsById = await this.invitationRepository.findMany(
                { ...filter, inviteeId: userId },
                options,
            );

            const invitationsByEmail = await this.invitationRepository.findMany(
                { ...filter, inviteeEmail: userEmail },
                options,
            );

            // 중복 제거하여 합치기
            const allInvitations = [
                ...invitationsById.data,
                ...invitationsByEmail.data.filter(
                    inv => !invitationsById.data.some(existing => existing.id === inv.id)
                ),
            ];

            return allInvitations;
        }

        // 모든 초대 조회
        const invitationsById = await this.invitationRepository.findByInviteeId(userId);
        const invitationsByEmail = await this.invitationRepository.findByInviteeEmail(userEmail);

        // 중복 제거하여 합치기
        const allInvitations = [
            ...invitationsById,
            ...invitationsByEmail.filter(
                inv => !invitationsById.some(existing => existing.id === inv.id)
            ),
        ];

        return allInvitations;
    }

    @Get('user/pending')
    @ApiOperation({
        summary: '대기 중인 초대 목록 조회',
        description: '사용자의 대기 중인 초대 목록을 조회합니다.',
    })
    @ApiOkResponse({ description: '대기 중인 초대 목록 조회 성공' })
    async getPendingInvitations(@Req() req: Request) {
        const userId = (req as any).user?.id;
        return this.invitationRepository.findPendingInvitations(userId);
    }

    @Delete(':id')
    @ApiOperation({
        summary: '초대 삭제',
        description: '초대를 삭제합니다. (초대를 보낸 사용자만 가능)',
    })
    @ApiParam({ name: 'id', description: '초대 ID' })
    @ApiOkResponse({ description: '초대가 성공적으로 삭제됨' })
    @ApiUnauthorizedResponse({ description: '인증 실패' })
    @ApiForbiddenResponse({ description: '권한 없음' })
    @ApiNotFoundResponse({ description: '초대를 찾을 수 없음' })
    async deleteInvitation(
        @Param('id') id: string,
        @Req() req: Request,
    ) {
        const userId = (req as any).user?.id;

        // 초대 조회 및 권한 확인
        const invitation = await this.invitationRepository.findById(id);
        if (!invitation) {
            throw new Error('Invitation not found');
        }

        if (invitation.inviterId !== userId) {
            throw new Error('You can only delete invitations you sent');
        }

        await this.invitationRepository.delete(id);
        return { message: 'Invitation deleted successfully' };
    }
}
