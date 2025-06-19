import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../modules/auth/auth.service';
import { User } from '../modules/users/entities/user.entity';


/**
 * JWT 인증 전략
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'taskflow-jwt-secret-key'),
    });
  }

  /**
   * JWT 페이로드 검증
   */
  async validate(payload: any): Promise<User> {
    const user = await this.authService.validateUser(payload);
    if (!user) {
      throw new Error('Unauthorized');
    }
    return user;
  }
}
