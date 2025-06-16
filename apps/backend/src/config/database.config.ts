import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ActivityLog } from '../activity-logs/entities/activity-log.entity';
import { Comment } from '../comments/entities/comment.entity';
import { ProjectInvitation } from '../invitations/entities/project-invitation.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { UserLog } from '../users/entities/user-log.entity';
import { User } from '../users/entities/user.entity';


/**
 * TypeORM 데이터베이스 설정 서비스
 */
@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) { }

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 5432),
      username: this.configService.get('DB_USERNAME', 'taskflow_user'),
      password: this.configService.get('DB_PASSWORD', 'taskflow_password'),
      database: this.configService.get('DB_DATABASE', 'taskflow_db'),
      entities: [
        User,
        Project,
        ProjectMember,
        Task,
        Comment,
        Notification,
        ActivityLog,
        ProjectInvitation,
        UserLog,
      ],
      synchronize: !isProduction,
      logging: false,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    };
  }

  /**
   * 데이터베이스 연결 상태 확인
   */
  public validateDatabaseConfig(): void {
    const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];

    for (const variable of requiredVars) {
      if (!this.configService.get(variable)) {
        throw new Error(`Missing required database environment variable: ${variable}`);
      }
    }
  }

  /**
   * 데이터베이스 연결 URL 생성
   */
  public getDatabaseUrl(): string {
    const host = this.configService.get<string>('DB_HOST');
    const port = this.configService.get<number>('DB_PORT');
    const username = this.configService.get<string>('DB_USERNAME');
    const password = this.configService.get<string>('DB_PASSWORD');
    const database = this.configService.get<string>('DB_DATABASE');

    return `postgresql://${username}:${password}@${host}:${port}/${database}`;
  }
}
