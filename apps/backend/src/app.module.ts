import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './presentation/controllers/app.controller';
import { AuthController } from './presentation/controllers/auth.controller';
import { AppService } from './application/services/app.service';
import { AuthService } from './application/services/auth.service';
import { JwtConfigService } from './shared/config/jwt.config';
import { JwtStrategy } from './infrastructure/config/jwt.strategy';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { HttpExceptionFilter } from './presentation/filters/http-exception.filter';
import { DatabaseConfig } from './infrastructure/config/database.config';
import { AppConfig } from './infrastructure/config/app.config';
import { User } from './domain/entities/user.entity';
import { Project } from './domain/entities/project.entity';
import { ProjectMember } from './domain/entities/project-member.entity';
import { Task } from './domain/entities/task.entity';
import { Comment } from './domain/entities/comment.entity';
import { ActivityLog } from './domain/entities/activity-log.entity';
import { Notification } from './domain/entities/notification.entity';
import { ProjectInvitation } from './domain/entities/project-invitation.entity';
import { UserRepository } from './infrastructure/adapters/repositories/user.repository';
import { UserRepositoryPort } from './application/ports/output/user-repository.port';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    // 환경 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true, // 환경변수 캐싱으로 성능 향상
    }),

    // 데이터베이스 설정 - 별도 설정 클래스 사용
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfig,
      inject: [ConfigService],
    }),

    // TypeORM 엔터티 등록
    TypeOrmModule.forFeature([
      User, 
      Project, 
      ProjectMember, 
      Task, 
      Comment, 
      ActivityLog, 
      Notification, 
      ProjectInvitation
    ]),

    // JWT 설정
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get<string>('JWT_SECRET', 'taskflow-jwt-secret-key'),
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController, AuthController],
  providers: [
    // Configuration Services
    DatabaseConfig,
    AppConfig,

    // Application Services
    AppService,
    AuthService,

    // JWT
    JwtConfigService,
    JwtStrategy,

    // Repositories
    {
      provide: 'UserRepositoryPort',
      useClass: UserRepository,
    },

    // Guards (global)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // Filters (global)
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {
  constructor(
    private readonly appConfig: AppConfig,
    private readonly databaseConfig: DatabaseConfig,
  ) {
    // 애플리케이션 시작 시 설정 검증
    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    try {
      // 필수 환경변수 검증
      this.appConfig.validateRequiredEnvVars();
      this.databaseConfig.validateDatabaseConfig();
      
      // 설정 정보 출력 (개발 환경에서만)
      if (this.appConfig.isDevelopment) {
        console.log('📋 Application Configuration:', JSON.stringify(this.appConfig.getConfigSummary(), null, 2));
      }
    } catch (error) {
      console.error('❌ Configuration validation failed:', error.message);
      process.exit(1);
    }
  }
}