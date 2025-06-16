import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 사용자 정보 DTO
 */
export class UserDto {
  @ApiProperty({
    description: '사용자 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '이메일 주소',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: '사용자 이름',
    example: '홍길동',
  })
  name: string;

  @ApiPropertyOptional({
    description: '프로필 이미지 URL',
    example: 'https://example.com/profile.jpg',
  })
  profileImage?: string;

  @ApiPropertyOptional({
    description: '프로필 색상 (HEX 코드)',
    example: '#3B82F6',
  })
  profileColor?: string;

  @ApiProperty({
    description: '계정 활성화 상태',
    example: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: '마지막 로그인 시간',
    example: '2023-12-01T12:00:00.000Z',
  })
  lastLoginAt?: string;

  @ApiProperty({
    description: '계정 생성 시간',
    example: '2023-12-01T12:00:00.000Z',
  })
  createdAt: string;
}

/**
 * 로그인 응답 DTO
 */
export class LoginResponseDto {
  @ApiProperty({
    description: '액세스 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: '토큰 타입',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: '토큰 만료 시간 (초)',
    example: 86400,
  })
  expiresIn: number;

  @ApiProperty({
    description: '사용자 정보',
    type: UserDto,
  })
  user: UserDto;
}

/**
 * 회원가입 응답 DTO
 */
export class RegisterResponseDto {
  @ApiProperty({
    description: '생성된 사용자 정보',
    type: UserDto,
  })
  user: UserDto;

  @ApiProperty({
    description: '회원가입 성공 메시지',
    example: '회원가입이 성공적으로 완료되었습니다.',
  })
  message: string;
}
