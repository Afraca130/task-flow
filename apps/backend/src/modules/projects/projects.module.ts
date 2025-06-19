import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogModule } from '../activity-logs/activity-log.module';
import { UsersModule } from '../users/users.module';
import { ProjectMember } from './entities/project-member.entity';
import { Project } from './entities/project.entity';
import { ProjectRepository } from './project.repository';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Project, ProjectMember]),
        UsersModule,
        ActivityLogModule,
    ],
    controllers: [ProjectsController],
    providers: [
        ProjectsService,
        ProjectRepository,
    ],
    exports: [
        ProjectsService,
        ProjectRepository,
    ],
})
export class ProjectsModule { }
