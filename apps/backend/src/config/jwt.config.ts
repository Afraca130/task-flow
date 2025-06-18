import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * JWT 설정 서비스
 */
@Injectable()
export class JwtConfig {
  constructor(private readonly configService: ConfigService) { }

  getJwtConfig() {
    const secret = this.configService.get<string>('JWT_SECRET', 'your-super-secret-jwt-key');
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '1h');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET', 'your-super-secret-refresh-key');
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '14d');

    return {
      secret,
      expiresIn,
      refreshSecret,
      refreshExpiresIn,
    };
  }

  /**
   * JWT 시크릿 검증
   */
  validateJwtSecret(): void {
    const secret = this.configService.get<string>('JWT_SECRET');
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const isProduction = nodeEnv === 'production';

    if (isProduction && (!secret || secret.length < 32)) {
      throw new Error('JWT_SECRET must be at least 32 characters long in production');
    }
  }
}
