import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { InvitationsModule } from './invitations/invitations.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';

// Config
import { AppConfig } from './config/app.config';
import { DatabaseConfig } from './config/database.config';
import { JwtConfigService } from './config/jwt.config';
import { JwtStrategy } from './config/jwt.strategy';
import { LoggingConfigService } from './config/logging.config';

// App Controller & Service
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Global Guards, Filters, Interceptors
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { IssueModule } from './issues/issue.module';

@Module({
  imports: [
    // 환경 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // PostgreSQL 데이터베이스 설정
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfig,
      inject: [ConfigService],
    }),

    // Feature Modules
    UsersModule,
    IssueModule,
    ProjectsModule,
    TasksModule,
    CommentsModule,
    InvitationsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    // Configuration Services
    DatabaseConfig,
    AppConfig,
    LoggingConfigService,

    // App Service
    AppService,

    // JWT
    JwtConfigService,
    JwtStrategy,

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
    private readonly configService: ConfigService
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

  // 개발 환경 디버깅 메서드
  private logDatabaseConnections(): void {
    console.log('Database connections initialized:');
    console.log('- PostgreSQL: ✓ (User/Auth/Business data)');
  }
}
