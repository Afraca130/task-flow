import { ApiProperty } from '@nestjs/swagger';

/**
 * 공통 API 응답 DTO
 * 모든 API 응답의 기본 구조를 정의합니다.
 */
export class ApiResponseDto<T = any> {
  @ApiProperty({
    description: '응답 성공 여부',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '응답 메시지',
    example: '요청이 성공적으로 처리되었습니다.',
  })
  message: string;

  @ApiProperty({
    description: '응답 데이터',
    required: false,
  })
  data?: T;

  @ApiProperty({
    description: '에러 정보 (실패 시)',
    required: false,
  })
  error?: {
    code: string;
    message: string;
    details?: any;
  };

  @ApiProperty({
    description: '응답 시간 (ISO 8601)',
    example: '2023-12-01T12:00:00.000Z',
  })
  timestamp: string;

  constructor(success: boolean, message: string, data?: T, error?: any) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }

  /**
   * 성공 응답을 생성하는 정적 메서드
   */
  static success<T>(data?: T, message = '요청이 성공적으로 처리되었습니다.'): ApiResponseDto<T> {
    return new ApiResponseDto(true, message, data);
  }

  /**
   * 실패 응답을 생성하는 정적 메서드
   */
  static error(message: string, error?: any): ApiResponseDto {
    return new ApiResponseDto(false, message, undefined, error);
  }
} 