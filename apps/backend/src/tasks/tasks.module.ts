import { ProjectsModule } from '@/projects/projects.module';
import { UsersModule } from '@/users/users.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateTaskUseCase } from './create-task.use-case';
import { Task } from './entities/task.entity';
import { TaskRepository } from './task.repository';
import { TaskController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { UpdateTaskUseCase } from './update-task.use-case';

@Module({
    imports: [TypeOrmModule.forFeature([Task]), ProjectsModule, UsersModule],
    controllers: [TaskController],
    providers: [
        TasksService,
        CreateTaskUseCase,
        UpdateTaskUseCase,
        {
            provide: 'TaskRepositoryPort',
            useClass: TaskRepository,
        },
    ],
    exports: [TasksService, 'TaskRepositoryPort'],
})
export class TasksModule { }
