import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
// import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './application/services/app.service';
import { AuthService } from './application/services/auth.service';
import { UserLogService } from './application/services/user-log.service';
import { AcceptInvitationUseCase } from './application/use-cases/invitation/accept-invitation.use-case';
import { CreateInvitationUseCase } from './application/use-cases/invitation/create-invitation.use-case';
import { DeclineInvitationUseCase } from './application/use-cases/invitation/decline-invitation.use-case';
import { CreateProjectUseCase } from './application/use-cases/project/create-project.usecase';
import { GetProjectUseCase } from './application/use-cases/project/get-project.usecase';
import { GetProjectsUseCase } from './application/use-cases/project/get-projects.usecase';
import { CreateTaskUseCase } from './application/use-cases/task/create-task.use-case';
import { ReorderTaskUseCase } from './application/use-cases/task/reorder-task.use-case';
import { UpdateTaskUseCase } from './application/use-cases/task/update-task.use-case';
// import { GetNotificationSummaryUseCase } from './application/use-cases/notification/get-notification-summary.use-case';
// import { GetNotificationsUseCase } from './application/use-cases/notification/get-notifications.use-case';
// import { MarkNotificationAsReadUseCase } from './application/use-cases/notification/mark-notification-as-read.use-case';
import { ActivityLog } from './domain/entities/activity-log.entity';
import { Comment } from './domain/entities/comment.entity';
import { Notification } from './domain/entities/notification.entity';
import { ProjectInvitation } from './domain/entities/project-invitation.entity';
import { ProjectMember } from './domain/entities/project-member.entity';
import { Project } from './domain/entities/project.entity';
import { Task } from './domain/entities/task.entity';
import { UserLog } from './domain/entities/user-log.entity';
import { User } from './domain/entities/user.entity';
// import { NotificationRepository } from './infrastructure/adapters/repositories/notification.repository';
import { ProjectInvitationRepository } from './infrastructure/adapters/repositories/project-invitation.repository';
import { ProjectRepository } from './infrastructure/adapters/repositories/project.repository';
import { TaskRepository } from './infrastructure/adapters/repositories/task.repository';
import { UserLogRepository } from './infrastructure/adapters/repositories/user-log.repository';
import { UserRepository } from './infrastructure/adapters/repositories/user.repository';
import { AppConfig } from './infrastructure/config/app.config';
import { DatabaseConfig } from './infrastructure/config/database.config';
import { JwtStrategy } from './infrastructure/config/jwt.strategy';
import { LoggingConfigService } from './infrastructure/config/logging.config';
// import { MongoDbConfig } from './infrastructure/config/mongodb.config';
import { AppController } from './presentation/controllers/app.controller';
import { AuthController } from './presentation/controllers/auth.controller';
import { InvitationController } from './presentation/controllers/invitation.controller';
import { NotificationController } from './presentation/controllers/notification.controller';
import { ProjectController } from './presentation/controllers/project.controller';
import { TaskController } from './presentation/controllers/task.controller';
import { UserLogController } from './presentation/controllers/user-log.controller';
import { HttpExceptionFilter } from './presentation/filters/http-exception.filter';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { LoggingInterceptor } from './presentation/interceptors/logging.interceptor';
import { ResponseInterceptor } from './presentation/interceptors/response.interceptor';
import { JwtConfigService } from './shared/config/jwt.config';

@Module({
  imports: [
    // 환경 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true, // 환경변수 캐싱으로 성능 향상
    }),

    // PostgreSQL 데이터베이스 설정 - 별도 설정 클래스 사용
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfig,
      inject: [ConfigService],
    }),

    // MongoDB 데이터베이스 설정 - 알림 시스템용
    // MongooseModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useClass: MongoDbConfig,
    //   inject: [ConfigService],
    // }),

    // TypeORM 엔터티 등록
    TypeOrmModule.forFeature([
      User,
      Project,
      ProjectMember,
      Task,
      Comment,
      ActivityLog,
      Notification,
      ProjectInvitation,
      UserLog
    ]),

    // MongoDB 스키마 등록
    // MongooseModule.forFeature([
    //   { name: NotificationSchema.name, schema: NotificationMongoSchema }
    // ]),

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
  controllers: [
    AppController,
    AuthController,
    TaskController,
    NotificationController,
    UserLogController,
    InvitationController,
    ProjectController,
  ],
  providers: [
    // Configuration Services
    DatabaseConfig,
    // MongoDbConfig,
    AppConfig,
    LoggingConfigService,

    // Application Services
    AppService,
    AuthService,
    UserLogService,

    // Use Cases
    // GetNotificationsUseCase,
    // MarkNotificationAsReadUseCase,
    // GetNotificationSummaryUseCase,
    CreateInvitationUseCase,
    AcceptInvitationUseCase,
    DeclineInvitationUseCase,
    CreateTaskUseCase,
    UpdateTaskUseCase,
    ReorderTaskUseCase,
    CreateProjectUseCase,
    GetProjectUseCase,
    GetProjectsUseCase,

    // JWT
    JwtConfigService,
    JwtStrategy,

    // Repositories
    {
      provide: 'UserRepositoryPort',
      useClass: UserRepository,
    },
    // {
    //   provide: 'NotificationRepositoryPort',
    //   useClass: NotificationRepository,
    // },
    {
      provide: 'UserLogRepositoryPort',
      useClass: UserLogRepository,
    },
    {
      provide: 'ProjectInvitationRepositoryPort',
      useClass: ProjectInvitationRepository,
    },
    {
      provide: 'TaskRepositoryPort',
      useClass: TaskRepository,
    },
    {
      provide: 'ProjectRepositoryPort',
      useClass: ProjectRepository,
    },

    // Use Case Providers
    {
      provide: 'CreateTaskUseCase',
      useClass: CreateTaskUseCase,
    },
    {
      provide: 'UpdateTaskUseCase',
      useClass: UpdateTaskUseCase,
    },
    {
      provide: 'ReorderTaskUseCase',
      useClass: ReorderTaskUseCase,
    },
    {
      provide: 'CreateProjectUseCase',
      useClass: CreateProjectUseCase,
    },
    {
      provide: 'GetProjectUseCase',
      useClass: GetProjectUseCase,
    },
    {
      provide: 'GetProjectsUseCase',
      useClass: GetProjectsUseCase,
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

    // Interceptors (global)
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {
  constructor(
    private readonly appConfig: AppConfig,
    private readonly databaseConfig: DatabaseConfig,
    // private readonly mongoDbConfig: MongoDbConfig,
  ) {
    // 애플리케이션 시작 시 설정 검증
    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    try {
      // 필수 환경변수 검증
      this.appConfig.validateRequiredEnvVars();
      this.databaseConfig.validateDatabaseConfig();
      // this.mongoDbConfig.validateMongoDbConfig();

      // 설정 정보 출력 (개발 환경에서만)
      if (this.appConfig.isDevelopment) {
        console.log('📋 Application Configuration:', JSON.stringify(this.appConfig.getConfigSummary(), null, 2));
      }
    } catch (error) {
      console.error('❌ Configuration validation failed:', error.message);
      process.exit(1);
    }
  }

  // 개발 환경 디버깅 메서드
  private logDatabaseConnections(): void {
    console.log('Database connections initialized:');
    console.log('- PostgreSQL: ✓ (User/Auth/Business data)');
    // console.log('- MongoDB: ✓ (Notifications/Real-time data)');
  }
}
