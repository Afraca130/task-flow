import { Injectable } from '@nestjs/common';
import { 
  HealthCheckUseCase, 
  HealthCheckCommand, 
  HealthCheckResult 
} from '../ports/input/health-check.use-case';
import { HealthCheckPort } from '../ports/output/health-check.port';

/**
 * 애플리케이션 서비스
 * 유스케이스를 조합하고 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class AppService implements HealthCheckUseCase {
  private readonly startTime: Date;

  constructor() {
    this.startTime = new Date();
  }

  /**
   * 간단한 인사 메시지를 반환합니다.
   */
  getHello(): string {
    return 'TaskFlow API is running! 🚀';
  }

  /**
   * 헬스체크를 실행합니다.
   */
  async execute(command: HealthCheckCommand): Promise<HealthCheckResult> {
    const healthData = await this.getHealthData(command);
    
    return {
      success: true,
      message: '서비스가 정상적으로 실행 중입니다.',
      data: healthData,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 헬스체크 데이터를 생성합니다.
   */
  private async getHealthData(command: HealthCheckCommand) {
    const now = new Date();
    const uptime = Math.floor((now.getTime() - this.startTime.getTime()) / 1000);

    return {
      status: 'healthy',
      service: 'TaskFlow Backend API',
      timestamp: now.toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      uptime,
    };
  }

  /**
   * 레거시 헬스체크 메서드 (하위 호환성)
   */
  getHealth(): { status: string; timestamp: string; service: string } {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'TaskFlow Backend API',
    };
  }
} 