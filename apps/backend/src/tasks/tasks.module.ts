import { CommentsModule } from '@/comments/comments.module';
import { UsersModule } from '@/users/users.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TaskRepository } from './task.repository';
import { TaskController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Task]),
        UsersModule,
        CommentsModule,
    ],
    controllers: [TaskController],
    providers: [
        TasksService,
        TaskRepository,
    ],
    exports: [TasksService, TaskRepository],
})
export class TasksModule { }
