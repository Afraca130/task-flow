import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';
import { CreateInvitationDto } from './dto/request/create-invitation.dto';
import { InvitationStatus, ProjectInvitation } from './entities/project-invitation.entity';
import { ProjectInvitationRepository } from './project-invitation.repository';

@Injectable()
export class InvitationsService {
    private readonly logger = new Logger(InvitationsService.name);

    constructor(
        private readonly invitationRepository: ProjectInvitationRepository,
        @InjectRepository(ProjectInvitation)
        private readonly typeormRepository: Repository<ProjectInvitation>,
        private readonly notificationsService: NotificationsService,
        private readonly usersService: UsersService,
        private readonly projectsService: ProjectsService,
    ) { }

    async createInvitation(createDto: CreateInvitationDto, inviterId?: string): Promise<ProjectInvitation> {
        this.logger.log(`Creating invitation for project: ${createDto.projectId}`);

        try {
            // Validate required fields
            if (!createDto.projectId) {
                throw new BadRequestException('Project ID is required');
            }

            if (!createDto.inviteeId) {
                throw new BadRequestException('Invitee ID is required');
            }

            if (!inviterId) {
                throw new BadRequestException('Inviter ID is required');
            }

            // Generate invitation token
            const inviteToken = crypto.randomBytes(32).toString('hex');
            this.logger.log(`🔑 Generated invitation token: ${inviteToken}`);

            // Calculate expiry date
            const expiryDays = 7; // Default 7 days
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiryDays);
            this.logger.log(`⏰ Invitation expires at: ${expiresAt.toISOString()}`);

            // Create invitation object
            const invitation = new ProjectInvitation();
            invitation.projectId = createDto.projectId;
            invitation.inviterId = inviterId;
            invitation.inviteeId = createDto.inviteeId;
            invitation.message = createDto.message;
            invitation.status = InvitationStatus.PENDING;
            invitation.expiresAt = expiresAt;
            // Generate token
            const timestamp = new Date().getTime().toString();
            const random = Math.random().toString(36).substring(2);
            invitation.token = `${timestamp}-${random}`;

            this.logger.log(`🏭 Created invitation entity with token: ${invitation.token}`);

            // Save the invitation directly using repository.save()
            const savedInvitation = await this.typeormRepository.save(invitation);

            this.logger.log(`✅ Invitation created successfully: ${savedInvitation.id}`);
            this.logger.log(`🔗 Invitation token stored: ${savedInvitation.token || 'NO TOKEN FOUND!'}`);

            // Create notification for the invitee
            try {
                this.logger.log(`🔔 Preparing invitation notification for user: ${createDto.inviteeId}`);

                const inviter = await this.usersService.findById(inviterId);
                const inviterName = inviter?.name || 'Someone';

                // Get project name if available
                const projectName = savedInvitation.project?.name || 'Project';

                this.logger.log(`👤 Inviter details: ${inviterName} (${inviterId})`);
                this.logger.log(`📁 Project details: ${projectName} (${createDto.projectId})`);

                const notification = await this.notificationsService.createProjectInvitationNotification(
                    createDto.inviteeId,
                    inviterName,
                    projectName,
                    savedInvitation.id,
                    savedInvitation.token,  // Pass token for notification data
                    createDto.projectId     // Pass actual projectId
                );

                this.logger.log(`✅ Invitation notification created: ${notification.id}`);
                this.logger.log(`📧 Notification data:`, {
                    id: notification.id,
                    userId: notification.userId,
                    type: notification.type,
                    title: notification.title,
                    data: notification.data
                });
            } catch (error) {
                this.logger.error(`💥 Failed to send invitation notification:`, error.stack || error);
                // Don't fail the invitation creation if notification fails
            }

            return savedInvitation;

        } catch (error) {
            this.logger.error(`Failed to create invitation for project: ${createDto.projectId}`, error);
            throw error;
        }
    }

    async acceptInvitation(token: string, userId: string): Promise<ProjectInvitation> {
        this.logger.log(`🎯 Accepting invitation with token: ${token} by user: ${userId}`);

        try {
            // Find invitation by token
            const invitation = await this.invitationRepository.findByToken(token);
            if (!invitation) {
                throw new NotFoundException('Invitation not found or invalid');
            }

            this.logger.log(`📧 Found invitation:`, {
                id: invitation.id,
                projectId: invitation.projectId,
                inviteeId: invitation.inviteeId,
                status: invitation.status,
                expiresAt: invitation.expiresAt
            });

            // Validate that the user accepting is the invitee
            if (invitation.inviteeId !== userId) {
                throw new BadRequestException('You can only accept invitations sent to you');
            }

            // Validate invitation status
            if (invitation.status !== InvitationStatus.PENDING) {
                this.logger.warn(`⚠️ Invitation already processed: ${invitation.status}`);

                if (invitation.status === InvitationStatus.ACCEPTED) {
                    // If already accepted, just return success (idempotent)
                    this.logger.log(`✅ Invitation already accepted, returning existing result`);
                    return invitation;
                } else if (invitation.status === InvitationStatus.DECLINED) {
                    throw new BadRequestException('This invitation has been declined and cannot be accepted');
                } else {
                    throw new BadRequestException(`This invitation has status: ${invitation.status}`);
                }
            }

            // Check if invitation is expired
            if (new Date() > invitation.expiresAt) {
                throw new BadRequestException('This invitation has expired');
            }

            // Accept invitation
            invitation.status = InvitationStatus.ACCEPTED;
            invitation.respondedAt = new Date();
            this.logger.log(`✅ Invitation status changed to: ${invitation.status}`);

            const updatedInvitation = await this.invitationRepository.update(invitation.id, invitation);

            // Add user to project as member
            try {
                this.logger.log(`👥 Adding user ${userId} to project ${invitation.projectId}`);
                await this.projectsService.addMember(invitation.projectId, userId);
                this.logger.log(`✅ User successfully added to project`);
            } catch (error) {
                this.logger.error(`💥 Failed to add user to project:`, error.stack || error);
                // Don't fail the invitation acceptance if member addition fails
            }

            this.logger.log(`🎉 Invitation accepted successfully: ${updatedInvitation.id}`);
            return updatedInvitation;

        } catch (error) {
            this.logger.error(`💥 Failed to accept invitation with token: ${token}`, error.stack || error);
            throw error;
        }
    }

    async declineInvitation(token: string, userId: string): Promise<ProjectInvitation> {
        this.logger.log(`Declining invitation with token: ${token}`);

        try {
            // Find invitation by token
            const invitation = await this.invitationRepository.findByToken(token);
            if (!invitation) {
                throw new NotFoundException('Invitation not found or invalid');
            }

            // Validate invitation
            if (invitation.status !== InvitationStatus.PENDING) {
                throw new BadRequestException('This invitation has already been processed');
            }

            // Check if invitation is expired
            if (new Date() > invitation.expiresAt) {
                throw new BadRequestException('This invitation has expired');
            }

            // Decline invitation
            invitation.status = InvitationStatus.DECLINED;
            invitation.respondedAt = new Date();

            const updatedInvitation = await this.invitationRepository.update(invitation.id, invitation);

            this.logger.log(`Invitation declined successfully: ${updatedInvitation.id}`);
            return updatedInvitation;

        } catch (error) {
            this.logger.error(`Failed to decline invitation with token: ${token}`, error);
            throw error;
        }
    }

    async getInvitationByToken(token: string): Promise<ProjectInvitation | null> {
        return await this.invitationRepository.findByToken(token);
    }

    async getProjectInvitations(projectId: string): Promise<ProjectInvitation[]> {
        return await this.invitationRepository.findByProjectId(projectId);
    }

    async getUserInvitations(userId: string): Promise<ProjectInvitation[]> {
        return await this.invitationRepository.findByInviteeId(userId);
    }

    async findByInviteeId(userId: string): Promise<ProjectInvitation[]> {
        return await this.invitationRepository.findByInviteeId(userId);
    }

    async findPendingInvitations(userId: string): Promise<ProjectInvitation[]> {
        return await this.invitationRepository.findPendingInvitations(userId);
    }

    async findById(id: string): Promise<ProjectInvitation | null> {
        return await this.invitationRepository.findById(id);
    }

    async findMany(filter: any, options: any): Promise<any> {
        return await this.invitationRepository.findMany(filter, options);
    }

    async delete(id: string): Promise<void> {
        await this.invitationRepository.delete(id);
    }

    async deleteInvitation(id: string, userId: string): Promise<void> {
        const invitation = await this.invitationRepository.findById(id);
        if (!invitation) {
            throw new NotFoundException('Invitation not found');
        }

        if (invitation.inviterId !== userId) {
            throw new BadRequestException('You can only delete invitations you sent');
        }

        await this.invitationRepository.delete(id);
    }
}
