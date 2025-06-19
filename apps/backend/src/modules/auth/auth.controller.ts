import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GetUser } from '../../decorators/authenticated-user.decorator';
import { Public } from '../../decorators/public.decorator';
import { ApiChangePassword, ApiGetProfile, ApiLogin, ApiRefreshToken, ApiRegister, ApiUpdateProfile } from '../../swagger/decorators/api-auth-responses.decorator';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { LoginResponseDto, RegisterResponseDto, UserDto } from './dto/auth-response.dto';
import { ChangePasswordRequestDto, LoginRequestDto, RefreshTokenRequestDto, RegisterRequestDto, UpdateProfileRequestDto } from './dto/request/auth-request.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * 인증 컨트롤러
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /**
   * 회원가입
   */
  @Public()
  @Post('register')
  @ApiRegister(RegisterRequestDto)
  async register(
    @Body() registerDto: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    return await this.authService.register(registerDto);
  }

  /**
   * 로그인
   */
  @Public()
  @Post('login')
  @ApiLogin(LoginRequestDto)
  async login(
    @Body() loginDto: LoginRequestDto,
  ): Promise<LoginResponseDto> {
    return await this.authService.login(loginDto);
  }

  /**
   * 프로필 조회
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiGetProfile()
  async getProfile(
    @GetUser() user: User,
  ): Promise<UserDto> {
    return await this.authService.getProfile(user.id);
  }

  /**
   * 프로필 업데이트
   */
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiUpdateProfile(UpdateProfileRequestDto)
  async updateProfile(
    @GetUser() user: User,
    @Body() updateProfileDto: UpdateProfileRequestDto,
  ): Promise<UserDto> {
    return await this.authService.updateProfile(user.id, updateProfileDto);
  }

  /**
   * 비밀번호 변경
   */
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @ApiBearerAuth('JWT-auth')
  @ApiChangePassword(ChangePasswordRequestDto)
  async changePassword(
    @GetUser() user: User,
    @Body() changePasswordDto: ChangePasswordRequestDto,
  ): Promise<{ message: string }> {
    await this.authService.changePassword(user.id, changePasswordDto);
    return { message: '비밀번호가 성공적으로 변경되었습니다.' };
  }

  @Post('refresh')
  @Public()
  @ApiRefreshToken(RefreshTokenRequestDto)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenRequestDto): Promise<LoginResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }
}
