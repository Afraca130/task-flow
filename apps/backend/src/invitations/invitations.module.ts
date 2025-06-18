import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { ProjectInvitation } from './entities/project-invitation.entity';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { ProjectInvitationRepository } from './project-invitation.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([ProjectInvitation]),
        NotificationsModule,
        UsersModule,
    ],
    controllers: [InvitationsController],
    providers: [
        InvitationsService,
        ProjectInvitationRepository,
    ],
    exports: [InvitationsService, ProjectInvitationRepository],
})
export class InvitationsModule { }
