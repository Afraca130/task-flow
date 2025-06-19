import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ActivityLogRepository } from "./activity-log.repository";
import { ActivityLogService } from "./activity-log.service";
import { ActivityLogsController } from "./activity-logs.controller";
import { ActivityLog } from "./entities/activity-log.entity";

@Module({
    imports: [TypeOrmModule.forFeature([ActivityLog])],
    controllers: [ActivityLogsController],
    providers: [
        ActivityLogService,
        ActivityLogRepository,
    ],
    exports: [ActivityLogService, ActivityLogRepository],
})
export class ActivityLogModule { }
