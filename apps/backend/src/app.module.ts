import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { IssueModule } from './modules/issues/issues.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { CommentsModule } from './modules/tasks/comments/comments.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { UsersModule } from './modules/users/users.module';

// Config
import { databaseConfig } from './config/database.config';
import { JwtConfig } from './config/jwt.config';
import { JwtStrategy } from './config/jwt.strategy';
import { LoggingConfigService } from './config/logging.config';

// App Controller & Service
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Global Guards, Filters, Interceptors
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { ActivityLogModule } from './modules/activity-logs/activity-log.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    // Environment Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database Configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),

    // Modules
    UsersModule,
    ProjectsModule,
    TasksModule,
    CommentsModule,
    IssueModule,
    InvitationsModule,
    AuthModule,
    ActivityLogModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    // Configuration Services
    LoggingConfigService,
    JwtConfig,
    JwtStrategy,
    AppService,

    // Global Filters
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },

    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },

    // Global Guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {
  constructor(
    private readonly configService: ConfigService
  ) {
    console.log('Environment:', this.configService.get('NODE_ENV'));
    console.log('Server Port:', this.configService.get('PORT') || '3000');
    console.log('Database Host:', this.configService.get('DB_HOST'));
  }
}
