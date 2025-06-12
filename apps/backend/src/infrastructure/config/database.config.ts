import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ActivityLog } from '../../domain/entities/activity-log.entity';
import { Comment } from '../../domain/entities/comment.entity';
import { Notification } from '../../domain/entities/notification.entity';
import { ProjectInvitation } from '../../domain/entities/project-invitation.entity';
import { ProjectMember } from '../../domain/entities/project-member.entity';
import { Project } from '../../domain/entities/project.entity';
import { Task } from '../../domain/entities/task.entity';
import { UserLog } from '../../domain/entities/user-log.entity';
import { User } from '../../domain/entities/user.entity';

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
      username: this.configService.get('DB_USERNAME', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'password'),
      database: this.configService.get('DB_NAME', 'taskflow'),
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
      logging: !isProduction,
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
