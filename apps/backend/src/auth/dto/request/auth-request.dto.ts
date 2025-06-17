import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsHexColor, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * 회원가입 요청 DTO
 */
export class RegisterRequestDto {
  @ApiProperty({
    description: '이메일 주소',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @ApiProperty({
    description: '비밀번호 (8-20자, 영문, 숫자, 특수문자 포함)',
    example: 'Password123!',
    minLength: 8,
    maxLength: 20,
  })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @MaxLength(20, { message: '비밀번호는 최대 20자까지 가능합니다.' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.',
  })
  password: string;

  @ApiProperty({
    description: '사용자 이름',
    example: '홍길동',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: '이름은 최소 2자 이상이어야 합니다.' })
  @MaxLength(50, { message: '이름은 최대 50자까지 가능합니다.' })
  name: string;
}

/**
 * 로그인 요청 DTO
 */
export class LoginRequestDto {
  @ApiProperty({
    description: '이메일 주소',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @ApiProperty({
    description: '비밀번호',
    example: 'Password123!',
  })
  @IsString()
  @MinLength(1, { message: '비밀번호를 입력해주세요.' })
  password: string;
}

/**
 * 프로필 업데이트 요청 DTO
 */
export class UpdateProfileRequestDto {
  @ApiProperty({
    description: '사용자 이름',
    example: '홍길동',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: '이름은 최소 2자 이상이어야 합니다.' })
  @MaxLength(50, { message: '이름은 최대 50자까지 가능합니다.' })
  name: string;

  @ApiPropertyOptional({
    description: '프로필 이미지 URL',
    example: 'https://example.com/profile.jpg',
  })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiPropertyOptional({
    description: '프로필 색상 (HEX 코드)',
    example: '#3B82F6',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsOptional()
  @IsHexColor({ message: '올바른 HEX 색상 코드를 입력해주세요. (예: #3B82F6)' })
  profileColor?: string;
}

/**
 * 비밀번호 변경 요청 DTO
 */
export class ChangePasswordRequestDto {
  @ApiProperty({
    description: '현재 비밀번호',
    example: 'CurrentPassword123!',
  })
  @IsString()
  @MinLength(1, { message: '현재 비밀번호를 입력해주세요.' })
  currentPassword: string;

  @ApiProperty({
    description: '새 비밀번호 (8-20자, 영문, 숫자, 특수문자 포함)',
    example: 'NewPassword123!',
    minLength: 8,
    maxLength: 20,
  })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @MaxLength(20, { message: '비밀번호는 최대 20자까지 가능합니다.' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.',
  })
  newPassword: string;
}

/**
 * 토큰 새로고침 요청 DTO
 */
export class RefreshTokenRequestDto {
  @ApiProperty({
    description: '리프레시 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty({ message: '리프레시 토큰은 필수입니다.' })
  @IsString({ message: '리프레시 토큰은 문자열이어야 합니다.' })
  readonly refreshToken: string;
}
