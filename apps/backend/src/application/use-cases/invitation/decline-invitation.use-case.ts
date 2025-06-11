import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectInvitation } from '../../../domain/entities/project-invitation.entity';
import { UserActionType } from '../../../domain/entities/user-log.entity';
import { ProjectInvitationRepositoryPort } from '../../ports/output/project-invitation-repository.port';
import { UserRepositoryPort } from '../../ports/output/user-repository.port';
import { UserLogService } from '../../services/user-log.service';

export interface DeclineInvitationCommand {
    token: string;
    userId: string;
}

export interface DeclineInvitationResult {
    invitation: ProjectInvitation;
}

@Injectable()
export class DeclineInvitationUseCase {
    constructor(
        @Inject('ProjectInvitationRepositoryPort')
        private readonly invitationRepository: ProjectInvitationRepositoryPort,
        @Inject('UserRepositoryPort')
        private readonly userRepository: UserRepositoryPort,
        private readonly userLogService: UserLogService,
    ) { }

    async execute(command: DeclineInvitationCommand): Promise<DeclineInvitationResult> {
        // 1. 토큰으로 초대 찾기
        const invitation = await this.invitationRepository.findByToken(command.token);
        if (!invitation) {
            throw new NotFoundException('Invitation not found');
        }

        // 2. 초대 상태 확인
        if (!invitation.isPending()) {
            if (invitation.isExpired()) {
                throw new BadRequestException('Invitation has expired');
            }
            throw new BadRequestException('Invitation is no longer pending');
        }

        // 3. 사용자 존재 확인
        const user = await this.userRepository.findById(command.userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // 4. 이메일 초대인 경우 이메일 일치 확인
        if (invitation.inviteeEmail && invitation.inviteeEmail !== user.email) {
            throw new BadRequestException('This invitation was sent to a different email address');
        }

        // 5. 사용자 ID 초대인 경우 사용자 일치 확인
        if (invitation.inviteeId && invitation.inviteeId !== command.userId) {
            throw new BadRequestException('This invitation was sent to a different user');
        }

        // 6. 초대 거절 처리
        invitation.decline();

        // 7. 초대 업데이트
        const updatedInvitation = await this.invitationRepository.update(invitation.id, {
            status: invitation.status,
            respondedAt: invitation.respondedAt,
        });

        // 8. 사용자 활동 로그 기록
        await this.userLogService.logUserActivity({
            userId: command.userId,
            actionType: UserActionType.PROJECT_LEAVE,
            description: `프로젝트 초대를 거절했습니다`,
            resourceId: invitation.projectId,
            resourceType: 'project',
            details: {
                invitationId: invitation.id,
                inviterId: invitation.inviterId,
            },
        });

        return {
            invitation: updatedInvitation,
        };
    }
}
