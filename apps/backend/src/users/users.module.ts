import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLog } from './entities/user-log.entity';
import { User } from './entities/user.entity';
import { UserLogController } from './user-log.controller';
import { UserLogRepository } from './user-log.repository';
import { UserLogService } from './user-log.service';
import { UserRepository } from './user.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
    imports: [TypeOrmModule.forFeature([User, UserLog])],
    controllers: [UsersController, UserLogController],
    providers: [
        UsersService,
        UserLogService,
        UserRepository,
        UserLogRepository,
    ],
    exports: [UsersService, UserLogService, UserRepository, UserLogRepository],
})
export class UsersModule { }
