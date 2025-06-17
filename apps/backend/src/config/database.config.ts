import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ActivityLog } from '../activity-logs/entities/activity-log.entity';
import { Comment } from '../comments/entities/comment.entity';
import { ProjectInvitation } from '../invitations/entities/project-invitation.entity';
import { IssueComment } from '../issues/entities/issue-comment.entity';
import { Issue } from '../issues/entities/issue.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';

export const databaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST', 'localhost'),
  port: configService.get<number>('DATABASE_PORT', 5432),
  username: configService.get<string>('DATABASE_USERNAME', 'postgres'),
  password: configService.get<string>('DATABASE_PASSWORD', 'password'),
  database: configService.get<string>('DATABASE_NAME', 'taskflow'),
  entities: [
    User,
    Project,
    ProjectMember,
    ProjectInvitation,
    Task,
    Comment,
    ActivityLog,
    Notification,
    Issue,
    IssueComment,
  ],
  synchronize: configService.get<boolean>('DATABASE_SYNC', true),
  logging: configService.get<boolean>('DATABASE_LOGGING', false),
  ssl: configService.get<string>('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
});
