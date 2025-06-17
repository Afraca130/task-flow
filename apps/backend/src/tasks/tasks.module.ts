import { CommentsModule } from '@/comments/comments.module';
import { UsersModule } from '@/users/users.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogModule } from '../activity-logs/activity-log.module';
import { Task } from './entities/task.entity';
import { TaskRepository } from './task.repository';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Task]),
        UsersModule,
        CommentsModule,
        ActivityLogModule,
    ],
    controllers: [TasksController],
    providers: [
        TasksService,
        TaskRepository,
    ],
    exports: [TasksService, TaskRepository],
})
export class TasksModule { }
