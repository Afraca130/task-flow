import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import {
    CreateInvitationRequest,
    InvitationFilter,
    InvitationPaginationOptions,
    PaginatedInvitationResult,
    ProjectInvitationRepositoryPort,
} from '../../../application/ports/output/project-invitation-repository.port';
import { InvitationStatus, ProjectInvitation } from '../../../domain/entities/project-invitation.entity';

@Injectable()
export class ProjectInvitationRepository implements ProjectInvitationRepositoryPort {
    private readonly logger = new Logger(ProjectInvitationRepository.name);

    constructor(
        @InjectRepository(ProjectInvitation)
        private readonly invitationRepository: Repository<ProjectInvitation>,
    ) { }

    async create(request: CreateInvitationRequest): Promise<ProjectInvitation> {
        try {
            let invitation: ProjectInvitation;

            if (request.inviteeEmail) {
                invitation = ProjectInvitation.create(
                    request.projectId,
                    request.inviterId,
                    request.inviteeEmail,
                    request.message,
                    request.expiryDays,
                );
            } else if (request.inviteeId) {
                invitation = ProjectInvitation.createForUser(
                    request.projectId,
                    request.inviterId,
                    request.inviteeId,
                    request.message,
                    request.expiryDays,
                );
            } else {
                throw new Error('Either inviteeEmail or inviteeId must be provided');
            }

            return await this.invitationRepository.save(invitation);
        } catch (error) {
            this.logger.error('Failed to create invitation', error);
            throw error;
        }
    }

    async findById(id: string): Promise<ProjectInvitation | null> {
        try {
            return await this.invitationRepository.findOne({
                where: { id },
                relations: ['project', 'inviter', 'invitee'],
            });
        } catch (error) {
            this.logger.error(`Failed to find invitation by id: ${id}`, error);
            throw error;
        }
    }

    async findByToken(token: string): Promise<ProjectInvitation | null> {
        try {
            return await this.invitationRepository.findOne({
                where: { token },
                relations: ['project', 'inviter', 'invitee'],
            });
        } catch (error) {
            this.logger.error(`Failed to find invitation by token: ${token}`, error);
            throw error;
        }
    }

    async findMany(
        filter: InvitationFilter,
        options: InvitationPaginationOptions,
    ): Promise<PaginatedInvitationResult> {
        try {
            const whereConditions = this.buildWhereConditions(filter);
            const { sortBy = 'createdAt', sortOrder = 'DESC' } = options;

            const [data, total] = await this.invitationRepository.findAndCount({
                where: whereConditions,
                relations: ['project', 'inviter', 'invitee'],
                order: { [sortBy]: sortOrder },
                skip: (options.page - 1) * options.limit,
                take: options.limit,
            });

            return {
                data,
                total,
                page: options.page,
                limit: options.limit,
                totalPages: Math.ceil(total / options.limit),
            };
        } catch (error) {
            this.logger.error('Failed to find invitations', error);
            throw error;
        }
    }

    async findByProjectId(projectId: string): Promise<ProjectInvitation[]> {
        try {
            return await this.invitationRepository.find({
                where: { projectId },
                relations: ['project', 'inviter', 'invitee'],
                order: { createdAt: 'DESC' },
            });
        } catch (error) {
            this.logger.error(`Failed to find invitations by project: ${projectId}`, error);
            throw error;
        }
    }

    async findByInviteeEmail(email: string): Promise<ProjectInvitation[]> {
        try {
            return await this.invitationRepository.find({
                where: { inviteeEmail: email },
                relations: ['project', 'inviter'],
                order: { createdAt: 'DESC' },
            });
        } catch (error) {
            this.logger.error(`Failed to find invitations by email: ${email}`, error);
            throw error;
        }
    }

    async findByInviteeId(userId: string): Promise<ProjectInvitation[]> {
        try {
            return await this.invitationRepository.find({
                where: { inviteeId: userId },
                relations: ['project', 'inviter'],
                order: { createdAt: 'DESC' },
            });
        } catch (error) {
            this.logger.error(`Failed to find invitations by user: ${userId}`, error);
            throw error;
        }
    }

    async findPendingInvitations(userId: string): Promise<ProjectInvitation[]> {
        try {
            return await this.invitationRepository.find({
                where: [
                    { inviteeId: userId, status: InvitationStatus.PENDING },
                    { inviteeEmail: userId, status: InvitationStatus.PENDING }, // 이메일로도 검색
                ],
                relations: ['project', 'inviter'],
                order: { createdAt: 'DESC' },
            });
        } catch (error) {
            this.logger.error(`Failed to find pending invitations for: ${userId}`, error);
            throw error;
        }
    }

    async update(id: string, updates: Partial<ProjectInvitation>): Promise<ProjectInvitation> {
        try {
            await this.invitationRepository.update(id, updates);
            const updated = await this.findById(id);
            if (!updated) {
                throw new Error(`Invitation with id ${id} not found after update`);
            }
            return updated;
        } catch (error) {
            this.logger.error(`Failed to update invitation: ${id}`, error);
            throw error;
        }
    }

    async delete(id: string): Promise<void> {
        try {
            const result = await this.invitationRepository.delete(id);
            if (result.affected === 0) {
                throw new Error(`Invitation with id ${id} not found`);
            }
        } catch (error) {
            this.logger.error(`Failed to delete invitation: ${id}`, error);
            throw error;
        }
    }

    async expireOldInvitations(): Promise<number> {
        try {
            const result = await this.invitationRepository.update(
                {
                    status: InvitationStatus.PENDING,
                    expiresAt: LessThan(new Date()),
                },
                {
                    status: InvitationStatus.EXPIRED,
                    respondedAt: new Date(),
                },
            );

            return result.affected || 0;
        } catch (error) {
            this.logger.error('Failed to expire old invitations', error);
            throw error;
        }
    }

    async checkExistingInvitation(
        projectId: string,
        inviteeEmail: string,
    ): Promise<ProjectInvitation | null> {
        try {
            return await this.invitationRepository.findOne({
                where: {
                    projectId,
                    inviteeEmail,
                    status: InvitationStatus.PENDING,
                },
            });
        } catch (error) {
            this.logger.error('Failed to check existing invitation', error);
            throw error;
        }
    }

    private buildWhereConditions(filter: InvitationFilter): any {
        const conditions: any = {};

        if (filter.projectId) {
            conditions.projectId = filter.projectId;
        }

        if (filter.inviterId) {
            conditions.inviterId = filter.inviterId;
        }

        if (filter.inviteeId) {
            conditions.inviteeId = filter.inviteeId;
        }

        if (filter.inviteeEmail) {
            conditions.inviteeEmail = filter.inviteeEmail;
        }

        if (filter.status) {
            conditions.status = filter.status;
        }

        if (filter.isExpired !== undefined) {
            if (filter.isExpired) {
                conditions.expiresAt = LessThan(new Date());
            } else {
                // 만료되지 않은 것들
                conditions.expiresAt = LessThan(new Date());
            }
        }

        return conditions;
    }
}
