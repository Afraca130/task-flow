import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { ErrorResponseDto } from '../common/dto/response/error-response.dto';
import { GetUser } from '../decorators/authenticated-user.decorator';
import { Public } from '../decorators/public.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { LoginResponseDto, RegisterResponseDto, UserDto } from './dto/auth-response.dto';
import { ChangePasswordRequestDto, LoginRequestDto, RefreshTokenRequestDto, RegisterRequestDto, UpdateProfileRequestDto } from './dto/request/auth-request.dto';

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
  @ApiOperation({ summary: '회원가입', description: '새로운 사용자 계정을 생성합니다.' })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    type: RegisterResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: 409, description: '이미 존재하는 이메일' })
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
  @ApiOperation({ summary: '로그인', description: '사용자 인증을 수행하고 JWT 토큰을 발급합니다.' })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
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
  @ApiOperation({ summary: '프로필 조회', description: '현재 로그인한 사용자의 프로필 정보를 조회합니다.' })
  @ApiResponse({
    status: 200,
    description: '프로필 조회 성공',
    type: UserDto,
  })
  @ApiResponse({ status: 401, description: '인증 필요' })
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
  @ApiOperation({ summary: '프로필 업데이트', description: '현재 로그인한 사용자의 프로필 정보를 업데이트합니다.' })
  @ApiResponse({
    status: 200,
    description: '프로필 업데이트 성공',
    type: UserDto,
  })
  @ApiResponse({ status: 401, description: '인증 필요' })
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
  @ApiOperation({ summary: '비밀번호 변경', description: '현재 로그인한 사용자의 비밀번호를 변경합니다.' })
  @ApiResponse({
    status: 200,
    description: '비밀번호 변경 성공',
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async changePassword(
    @GetUser() user: User,
    @Body() changePasswordDto: ChangePasswordRequestDto,
  ): Promise<{ message: string }> {
    await this.authService.changePassword(user.id, changePasswordDto);
    return { message: '비밀번호가 성공적으로 변경되었습니다.' };
  }

  @Post('refresh')
  @Public()
  @ApiOperation({
    summary: '토큰 새로고침',
    description: '리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급받습니다',
  })
  @ApiBody({
    type: RefreshTokenRequestDto,
    description: '리프레시 토큰 정보',
  })
  @ApiCreatedResponse({
    description: '토큰 새로고침 성공',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '유효하지 않은 리프레시 토큰',
    type: ErrorResponseDto,
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenRequestDto): Promise<LoginResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }
}
