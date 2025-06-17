import { ProjectInvitation } from '@/invitations/entities/project-invitation.entity';
import { InvitationsModule } from '@/invitations/invitations.module';
import { ProjectInvitationRepository } from '@/invitations/project-invitation.repository';
import { UsersModule } from '@/users/users.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectMember } from './entities/project-member.entity';
import { Project } from './entities/project.entity';
import { ProjectRepository } from './project.repository';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Project, ProjectMember, ProjectInvitation]),
        UsersModule,
        InvitationsModule,
    ],
    controllers: [ProjectsController],
    providers: [
        ProjectsService,
        ProjectRepository,
        ProjectInvitationRepository,
    ],
    exports: [ProjectsService, ProjectRepository],
})
export class ProjectsModule { }
