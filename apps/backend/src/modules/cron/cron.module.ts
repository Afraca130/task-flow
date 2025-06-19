import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';
import { CronService } from './cron.service';

@Module({
    imports: [TasksModule, ProjectsModule, NotificationsModule],
    controllers: [],
    providers: [CronService],
    exports: [CronService],
})
export class CronModule { }
