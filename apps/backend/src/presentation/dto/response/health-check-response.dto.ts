import { ApiProperty } from '@nestjs/swagger';

/**
 * 헬스체크 응답 데이터 DTO
 */
export class HealthCheckDataDto {
  @ApiProperty({
    description: '서비스 상태',
    example: 'healthy',
    enum: ['healthy', 'unhealthy', 'degraded'],
  })
  status: string;

  @ApiProperty({
    description: '서비스 이름',
    example: 'TaskFlow Backend API',
  })
  service: string;

  @ApiProperty({
    description: '응답 시간 (ISO 8601)',
    example: '2023-12-01T12:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: '서버 환경',
    example: 'development',
  })
  environment: string;

  @ApiProperty({
    description: '서버 버전',
    example: '1.0.0',
  })
  version: string;

  @ApiProperty({
    description: '가동 시간 (초)',
    example: 3600,
  })
  uptime: number;
}

/**
 * 헬스체크 응답 DTO
 */
export class HealthCheckResponseDto {
  @ApiProperty({
    description: '응답 성공 여부',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '응답 메시지',
    example: '서비스가 정상적으로 실행 중입니다.',
  })
  message: string;

  @ApiProperty({
    description: '헬스체크 데이터',
    type: HealthCheckDataDto,
  })
  data: HealthCheckDataDto;

  @ApiProperty({
    description: '응답 시간 (ISO 8601)',
    example: '2023-12-01T12:00:00.000Z',
  })
  timestamp: string;
} 