import { Controller, Post, Body, Get, Patch, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from '../../application/services/auth.service';
import { RegisterRequestDto, LoginRequestDto, ChangePasswordRequestDto } from '../dto/request/auth-request.dto';
import { LoginResponseDto, RegisterResponseDto, UserDto } from '../dto/response/auth-response.dto';
import { ApiResponseDto } from '../dto/response/api-response.dto';
import { Public } from '../decorators/public.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../../domain/entities/user.entity';

interface AuthenticatedRequest extends Request {
  user: User;
}

/**
 * 인증 컨트롤러
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 회원가입
   */
  @Public()
  @Post('register')
  @ApiOperation({ summary: '회원가입', description: '새로운 사용자 계정을 생성합니다.' })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    type: ApiResponseDto<RegisterResponseDto>,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: 409, description: '이미 존재하는 이메일' })
  async register(
    @Body() registerDto: RegisterRequestDto,
  ): Promise<ApiResponseDto<RegisterResponseDto>> {
    const result = await this.authService.register(registerDto);
    return {
      success: true,
      message: '회원가입이 성공적으로 완료되었습니다.',
      data: result,
      timestamp: new Date().toISOString(),
    };
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
    type: ApiResponseDto<LoginResponseDto>,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async login(
    @Body() loginDto: LoginRequestDto,
  ): Promise<ApiResponseDto<LoginResponseDto>> {
    const result = await this.authService.login(loginDto);
    return {
      success: true,
      message: '로그인이 성공적으로 완료되었습니다.',
      data: result,
      timestamp: new Date().toISOString(),
    };
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
    type: ApiResponseDto<UserDto>,
  })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async getProfile(
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiResponseDto<UserDto>> {
    const result = await this.authService.getProfile(req.user.id);
    return {
      success: true,
      message: '프로필 정보를 성공적으로 조회했습니다.',
      data: result,
      timestamp: new Date().toISOString(),
    };
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
    type: ApiResponseDto<null>,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordRequestDto,
  ): Promise<ApiResponseDto<null>> {
    await this.authService.changePassword(req.user.id, changePasswordDto);
    return {
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
} 