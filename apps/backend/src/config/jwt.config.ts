import { Injectable } from '@nestjs/common';
import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt';
import { AppConfig } from './app.config';


/**
 * JWT 설정 팩토리
 */
@Injectable()
export class JwtConfigService implements JwtOptionsFactory {
  constructor(private readonly appConfig: AppConfig) { }

  createJwtOptions(): JwtModuleOptions {
    const jwtConfig = this.appConfig.jwt;

    return {
      secret: jwtConfig.secret,
      signOptions: {
        expiresIn: jwtConfig.expiresIn,
      },
    };
  }

  /**
   * JWT 시크릿 키 반환
   */
  getSecret(): string {
    return this.appConfig.jwt.secret;
  }

  /**
   * JWT 만료 시간 반환
   */
  getExpiresIn(): string {
    return this.appConfig.jwt.expiresIn;
  }

  /**
   * JWT 설정 검증
   */
  validateJwtConfig(): void {
    const { secret } = this.appConfig.jwt;

    if (!secret) {
      throw new Error('JWT_SECRET is required');
    }

    if (this.appConfig.isProduction && secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long in production');
    }
  }
}
