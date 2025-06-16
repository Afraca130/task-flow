import { ProjectInvitationRepositoryPort } from './interfaces/project-invitation-repository.port';
import { UserRepositoryPort } from '../users/interfaces/user-repository.port';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectInvitation } from './entities/project-invitation.entity';

export interface CreateInvitationCommand {
    projectId: string;
    inviterId: string;
    inviteeEmail?: string;
    inviteeId?: string;
    message?: string;
    expiryDays?: number;
}

export interface CreateInvitationResult {
    invitation: ProjectInvitation;
    inviteUrl: string;
}

@Injectable()
export class CreateInvitationUseCase {
    constructor(
        @Inject('ProjectInvitationRepositoryPort')
        private readonly invitationRepository: ProjectInvitationRepositoryPort,
        @Inject('UserRepositoryPort')
        private readonly userRepository: UserRepositoryPort,
    ) { }

    async execute(command: CreateInvitationCommand): Promise<CreateInvitationResult> {
        // 1. 이메일 또는 사용자 ID가 제공되었는지 확인
        if (!command.inviteeEmail && !command.inviteeId) {
            throw new BadRequestException('Either inviteeEmail or inviteeId must be provided');
        }

        // 2. 초대자가 존재하는지 확인
        const inviter = await this.userRepository.findById(command.inviterId);
        if (!inviter) {
            throw new NotFoundException('Inviter not found');
        }

        // 3. 사용자 ID가 제공된 경우 사용자 존재 확인
        if (command.inviteeId) {
            const invitee = await this.userRepository.findById(command.inviteeId);
            if (!invitee) {
                throw new NotFoundException('Invitee user not found');
            }
        }

        // 4. 이메일이 제공된 경우 기존 초대 확인
        if (command.inviteeEmail) {
            const existingInvitation = await this.invitationRepository.checkExistingInvitation(
                command.projectId,
                command.inviteeEmail,
            );
            if (existingInvitation) {
                throw new BadRequestException('An invitation for this email already exists');
            }
        }

        // 5. 초대 생성
        const invitation = await this.invitationRepository.create({
            projectId: command.projectId,
            inviterId: command.inviterId,
            inviteeEmail: command.inviteeEmail,
            inviteeId: command.inviteeId,
            message: command.message,
            expiryDays: command.expiryDays || 7,
        });

        // 6. 초대 URL 생성
        const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${invitation.token}`;

        return {
            invitation,
            inviteUrl,
        };
    }
}
