import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 애플리케이션 설정 서비스
 */
@Injectable()
export class AppConfig {
  constructor(private readonly configService: ConfigService) { }

  // 애플리케이션 설정
  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get port(): number {
    return this.configService.get<number>('PORT', 3001);
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  // API 설정
  get apiPrefix(): string {
    return this.configService.get<string>('API_PREFIX', 'api');
  }

  get apiVersion(): string {
    return this.configService.get<string>('API_VERSION', 'v1');
  }

  // CORS 설정
  get allowedOrigins(): string[] {
    const origins = this.configService.get<string>('ALLOWED_ORIGINS', 'http://localhost:3000');
    return origins.split(',').map(origin => origin.trim());
  }

  // Swagger 설정
  get swaggerEnabled(): boolean {
    return this.configService.get<boolean>('SWAGGER_ENABLED', !this.isProduction);
  }

  get swaggerPath(): string {
    return this.configService.get<string>('SWAGGER_PATH', 'api/docs');
  }

  // 데이터베이스 설정은 DatabaseConfig에서 관리됨

  // JWT 설정
  get jwt() {
    return {
      secret: this.configService.get<string>('JWT_SECRET', 'your-super-secret-jwt-key'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1h'),
      refreshSecret: this.configService.get<string>('JWT_REFRESH_SECRET', 'your-super-secret-refresh-key'),
      refreshExpiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '14d'),
    };
  }

  /**
   * 필수 환경변수 검증
   */
  public validateRequiredEnvVars(): void {
    const requiredVars = [
      'DB_HOST',
      'DB_PORT',
      'DB_USERNAME',
      'DB_PASSWORD',
      'DB_DATABASE',
      'JWT_SECRET',
    ];

    const missingVars = requiredVars.filter(variable => !this.configService.get(variable));

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // JWT 시크릿 보안 검증
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (this.isProduction && (!jwtSecret || jwtSecret.length < 32)) {
      throw new Error('JWT_SECRET must be at least 32 characters long in production');
    }
  }

  /**
   * 설정 정보 출력 (민감한 정보 제외)
   */
  public getConfigSummary() {
    return {
      environment: this.nodeEnv,
      port: this.port,
      apiPrefix: this.apiPrefix,
      apiVersion: this.apiVersion,
      // 데이터베이스 정보는 DatabaseConfig에서 관리됨
      swagger: {
        enabled: this.swaggerEnabled,
        path: this.swaggerPath,
      },
      cors: {
        allowedOrigins: this.allowedOrigins,
      },
    };
  }
}
