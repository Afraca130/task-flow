import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';

/**
 * 헬스체크 요청 DTO
 */
export class HealthCheckRequestDto {
  @ApiProperty({
    description: '상세 정보 포함 여부',
    example: true,
    required: false,
  })
  @IsOptional()
  detailed?: boolean;

  @ApiProperty({
    description: '체크할 서비스 타입',
    example: 'all',
    enum: ['all', 'database', 'redis', 'api'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['all', 'database', 'redis', 'api'])
  type?: string;
} 