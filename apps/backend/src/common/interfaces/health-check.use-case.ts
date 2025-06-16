import { HealthCheckData } from "./health-check.port";


/**
 * 헬스체크 명령
 */
export interface HealthCheckCommand {
  detailed?: boolean;
  type?: string;
}

/**
 * 헬스체크 결과
 */
export interface HealthCheckResult {
  success: boolean;
  message: string;
  data: HealthCheckData;
  timestamp: string;
}

/**
 * 헬스체크 유스케이스 인터페이스
 */
export interface HealthCheckUseCase {
  /**
   * 헬스체크 실행
   */
  execute(command: HealthCheckCommand): Promise<HealthCheckResult>;
}
