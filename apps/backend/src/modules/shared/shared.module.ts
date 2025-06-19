import { forwardRef, Global, Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { ProjectsService } from '../projects/projects.service';
import { TasksModule } from '../tasks/tasks.module';
import { TasksService } from '../tasks/tasks.service';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';

@Global()
@Module({
    imports: [
        forwardRef(() => UsersModule),
        forwardRef(() => ProjectsModule),
        forwardRef(() => TasksModule),
    ],
    providers: [
        // Interface providers for dependency injection
        {
            provide: 'IUserService',
            useExisting: UsersService,
        },
        {
            provide: 'IProjectService',
            useExisting: ProjectsService,
        },
        {
            provide: 'ITaskService',
            useExisting: TasksService,
        },
    ],
    exports: [
        // Export modules so their services are available
        UsersModule,
        ProjectsModule,
        TasksModule,
        // Export interface providers
        'IUserService',
        'IProjectService',
        'ITaskService',
    ],
})
export class SharedModule { }
