import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogModule } from '../activity-logs/activity-log.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { CommentsModule } from './comments/comments.module';
import { Task } from './entities/task.entity';
import { TaskRepository } from './task.repository';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Task]),
        ActivityLogModule,
        NotificationsModule,
        UsersModule,
        CommentsModule,
    ],
    controllers: [TasksController],
    providers: [
        TasksService,
        TaskRepository,
    ],
    exports: [
        TasksService,
        TaskRepository,
    ],
})
export class TasksModule { }
