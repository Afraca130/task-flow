import { ActivityLogModule } from "@/activity-logs/activity-log.module";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationsModule } from "../notifications/notifications.module";
import { UsersModule } from "../users/users.module";
import { Issue } from "./entities/issue.entity";
import { IssuesController } from './issues.controller';
import { IssuesRepository } from './issues.repository';
import { IssuesService } from './issues.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Issue]),
        ActivityLogModule,
        NotificationsModule,
        UsersModule,
    ],
    controllers: [IssuesController],
    providers: [
        IssuesService,
        IssuesRepository,
    ],
    exports: [IssuesService, IssuesRepository],
})
export class IssueModule { }
