import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { ProjectInvitation } from './entities/project-invitation.entity';
import { ProjectInvitationRepository } from './invitation.repository';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([ProjectInvitation]),
        NotificationsModule,
        UsersModule,
        ProjectsModule,
    ],
    controllers: [InvitationsController],
    providers: [
        InvitationsService,
        ProjectInvitationRepository,
    ],
    exports: [InvitationsService, ProjectInvitationRepository],
})
export class InvitationsModule { }
