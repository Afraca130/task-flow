import { TimeUtil } from '@/common/utils/time.util';

import { User } from '@/users/entities/user.entity';
import { UserRepository } from '@/users/user.repository';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginResponseDto, RegisterResponseDto, UserDto } from './dto/auth-response.dto';
import { ChangePasswordRequestDto, LoginRequestDto, RegisterRequestDto, UpdateProfileRequestDto } from './dto/request/auth-request.dto';

/**
 * 인증 서비스
 * 사용자 인증 및 권한 관리를 담당합니다.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) { }

  /**
   * 회원가입
   */
  async register(registerDto: RegisterRequestDto): Promise<RegisterResponseDto> {
    const { email, password, name } = registerDto;

    // 이메일 중복 확인
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    // 비밀번호 해싱
    const hashedPassword = await this.hashPassword(password);

    // 사용자 생성
    const user = await this.userRepository.create({
      email,
      password: hashedPassword,
      name,
    });

    return {
      user: this.toUserDto(user),
      message: '회원가입이 성공적으로 완료되었습니다.',
    };
  }

  /**
   * 로그인
   */
  async login(loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    // 사용자 조회
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // 계정 활성화 확인
    if (!user.isActive) {
      throw new UnauthorizedException('비활성화된 계정입니다.');
    }

    // 비밀번호 확인
    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // 마지막 로그인 시간 업데이트
    await this.userRepository.updateLastLoginAt(user.id);

    // JWT 토큰 생성
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 3600, // 1시간
      user: this.toUserDto(user),
    };
  }

  /**
   * 비밀번호 변경
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordRequestDto): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    // 현재 비밀번호 확인
    const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.');
    }

    // 새 비밀번호 해싱 및 업데이트
    const hashedNewPassword = await this.hashPassword(newPassword);
    await this.userRepository.updatePassword(userId, hashedNewPassword);
  }

  /**
   * 사용자 정보 조회
   */
  async getProfile(userId: string): Promise<UserDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    return this.toUserDto(user);
  }

  /**
   * 프로필 업데이트
   */
  async updateProfile(userId: string, updateProfileDto: UpdateProfileRequestDto): Promise<UserDto> {
    const { name, profileImage, profileColor } = updateProfileDto;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    // 프로필 업데이트
    const updatedUser = await this.userRepository.update(userId, {
      name,
      profileImage,
      profileColor,
    });

    return this.toUserDto(updatedUser);
  }

  /**
   * JWT 토큰 검증
   */
  async validateUser(payload: any): Promise<User | null> {
    const user = await this.userRepository.findById(payload.sub);
    if (user && user.isActive) {
      return user;
    }
    return null;
  }

  /**
   * 비밀번호 해싱
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * 비밀번호 검증
   */
  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * JWT 액세스 토큰 생성
   */
  private async generateAccessToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    return this.jwtService.signAsync(payload);
  }

  /**
   * JWT 리프레시 토큰 생성
   */
  private async generateRefreshToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      type: 'refresh',
    };

    return this.jwtService.signAsync(payload, {
      expiresIn: '14d',
    });
  }

  /**
   * User 엔터티를 UserDto로 변환
   */
  private toUserDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      profileColor: user.profileColor,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt ? TimeUtil.formatISO(user.lastLoginAt) : undefined,
      createdAt: TimeUtil.formatISO(user.createdAt),
    };
  }

  /**
   * 리프레시 토큰으로 액세스 토큰 갱신
   */
  async refreshToken(refreshToken: string): Promise<LoginResponseDto> {
    try {
      // 리프레시 토큰 검증
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
      });

      // 토큰 타입 확인
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
      }

      // 사용자 조회
      const user = await this.userRepository.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
      }

      // 새 토큰 생성
      const newAccessToken = await this.generateAccessToken(user);
      const newRefreshToken = await this.generateRefreshToken(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        tokenType: 'Bearer',
        expiresIn: 3600, // 1시간
        user: this.toUserDto(user),
      };
    } catch (error) {
      throw new UnauthorizedException('리프레시 토큰이 유효하지 않습니다.');
    }
  }
}
