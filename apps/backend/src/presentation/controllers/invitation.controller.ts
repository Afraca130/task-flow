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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
import { CreateInvitationDto } from '../dto/request/create-invitation.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
    ApiAcceptInvitation,
    ApiCreateInvitation,
    ApiDeclineInvitation,
    ApiDeleteInvitation,
    ApiGetInvitation,
    ApiGetProjectInvitations,
    ApiGetReceivedInvitations,
} from '../swagger/decorators/api-invitation-responses.decorator';

@ApiTags('invitations')
@Controller('invitations')
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
    @ApiCreateInvitation(CreateInvitationDto)
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
    @ApiAcceptInvitation()
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
    @ApiDeclineInvitation()
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
    @ApiGetInvitation()
    async getInvitationByToken(@Param('token') token: string) {
        return this.invitationRepository.findByToken(token);
    }

    @Get('project/:projectId')
    @ApiGetProjectInvitations()
    async getProjectInvitations(@Param('projectId') projectId: string) {
        return this.invitationRepository.findByProjectId(projectId);
    }

    @Get('user/received')
    @ApiGetReceivedInvitations()
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
    @ApiGetReceivedInvitations()
    async getPendingInvitations(@Req() req: Request) {
        const userId = (req as any).user?.id;
        return this.invitationRepository.findPendingInvitations(userId);
    }

    @Delete(':id')
    @ApiDeleteInvitation()
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
