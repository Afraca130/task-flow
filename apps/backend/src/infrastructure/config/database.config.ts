import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { User } from '../../domain/entities/user.entity';
import { Project } from '../../domain/entities/project.entity';
import { ProjectMember } from '../../domain/entities/project-member.entity';
import { Task } from '../../domain/entities/task.entity';
import { Comment } from '../../domain/entities/comment.entity';
import { ActivityLog } from '../../domain/entities/activity-log.entity';
import { Notification } from '../../domain/entities/notification.entity';
import { ProjectInvitation } from '../../domain/entities/project-invitation.entity';

/**
 * TypeORM 데이터베이스 설정 서비스
 */
@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    
    return {
      type: this.configService.get<'postgres'>('DB_TYPE', 'postgres'),
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      username: this.configService.get<string>('DB_USERNAME', 'taskflow_user'),
      password: this.configService.get<string>('DB_PASSWORD', 'taskflow_password'),
      database: this.configService.get<string>('DB_DATABASE', 'taskflow_db'),
      
      // 엔티티 등록
      entities: [
        User,
        Project,
        ProjectMember,
        Task,
        Comment,
        ActivityLog,
        Notification,
        ProjectInvitation,
      ],
      
      // 스키마 동기화 (프로덕션에서는 false)
      synchronize: !isProduction,
      
      // 로깅 설정
      logging: this.configService.get<boolean>('DB_LOGGING', !isProduction),
      
      // SSL 설정 (프로덕션에서만)
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      
      // 연결 풀 설정
      extra: {
        max: this.configService.get<number>('DB_MAX_CONNECTIONS', 10),
        idleTimeoutMillis: this.configService.get<number>('DB_IDLE_TIMEOUT', 30000),
        connectionTimeoutMillis: this.configService.get<number>('DB_CONNECTION_TIMEOUT', 2000),
      },
      
      // 마이그레이션 설정
      migrations: ['dist/infrastructure/persistence/migrations/*.js'],
      migrationsTableName: 'typeorm_migrations',
      migrationsRun: false,
      
      // 기타 설정
      retryAttempts: this.configService.get<number>('DB_RETRY_ATTEMPTS', 10),
      retryDelay: this.configService.get<number>('DB_RETRY_DELAY', 3000),
      autoLoadEntities: false, // entities 배열을 명시적으로 사용
      keepConnectionAlive: true,
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