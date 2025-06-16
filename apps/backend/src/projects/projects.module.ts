import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectInvitation } from '../invitations/entities/project-invitation.entity';
import { User } from '../users/entities/user.entity';
import { ProjectMember } from './entities/project-member.entity';
import { Project } from './entities/project.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
    imports: [TypeOrmModule.forFeature([Project, ProjectMember, ProjectInvitation, User])],
    controllers: [ProjectsController],
    providers: [ProjectsService],
    exports: [ProjectsService],
})
export class ProjectsModule { }
