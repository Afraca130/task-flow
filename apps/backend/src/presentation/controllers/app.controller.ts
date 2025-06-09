import { Controller, Get, Query } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiQuery 
} from '@nestjs/swagger';
import { AppService } from '../../application/services/app.service';
import { HealthCheckRequestDto } from '../dto/request/health-check-request.dto';
import { HealthCheckResponseDto } from '../dto/response/health-check-response.dto';
import { ApiResponseDto } from '../dto/response/api-response.dto';

/**
 * 애플리케이션 컨트롤러
 * 헬스체크 및 기본 API 엔드포인트를 제공합니다.
 */
@ApiTags('Application')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ 
    summary: '기본 헬스체크', 
    description: '애플리케이션이 실행 중인지 확인하는 간단한 엔드포인트입니다.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: '애플리케이션이 정상적으로 실행 중입니다.',
    type: String,
    schema: {
      example: 'TaskFlow API is running! 🚀'
    }
  })
  @ApiResponse({ 
    status: 500, 
    description: '서버 내부 오류' 
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ 
    summary: '상세 헬스체크', 
    description: '애플리케이션의 상세한 상태 정보를 반환합니다.' 
  })
  @ApiQuery({ 
    name: 'detailed', 
    required: false, 
    type: Boolean, 
    description: '상세 정보 포함 여부' 
  })
  @ApiQuery({ 
    name: 'type', 
    required: false, 
    enum: ['all', 'database', 'redis', 'api'],
    description: '체크할 서비스 타입' 
  })
  @ApiResponse({ 
    status: 200, 
    description: '헬스체크가 성공적으로 완료되었습니다.',
    type: HealthCheckResponseDto
  })
  @ApiResponse({ 
    status: 500, 
    description: '헬스체크 실행 중 오류가 발생했습니다.',
    type: ApiResponseDto
  })
  async getDetailedHealth(
    @Query() query: HealthCheckRequestDto
  ): Promise<HealthCheckResponseDto> {
    const result = await this.appService.execute({
      detailed: query.detailed,
      type: query.type,
    });

    return {
      success: result.success,
      message: result.message,
      data: result.data,
      timestamp: result.timestamp,
    };
  }

  @Get('health/legacy')
  @ApiOperation({ 
    summary: '레거시 헬스체크 (Deprecated)', 
    description: '이전 버전과의 호환성을 위한 헬스체크 엔드포인트입니다. 새로운 개발에서는 /health 엔드포인트를 사용하세요.',
    deprecated: true
  })
  @ApiResponse({ 
    status: 200, 
    description: '애플리케이션 헬스체크 상태',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', example: '2023-12-01T12:00:00.000Z' },
        service: { type: 'string', example: 'TaskFlow Backend API' }
      }
    }
  })
  getLegacyHealth(): { status: string; timestamp: string; service: string } {
    return this.appService.getHealth();
  }
} 