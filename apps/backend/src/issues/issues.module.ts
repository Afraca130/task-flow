import { ActivityLogModule } from "@/activity-logs/activity-log.module";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IssueComment } from "./entities/issue-comment.entity";
import { Issue } from "./entities/issue.entity";
import { IssuesController } from './issues.controller';
import { IssuesRepository } from './issues.repository';
import { IssuesService } from './issues.service';

@Module({
    imports: [TypeOrmModule.forFeature([Issue, IssueComment]), ActivityLogModule],
    controllers: [IssuesController],
    providers: [
        IssuesService,
        IssuesRepository,
    ],
    exports: [IssuesService, IssuesRepository],
})
export class IssueModule { }
