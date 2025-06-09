/**
 * 헬스체크 데이터 인터페이스
 */
export interface HealthCheckData {
  status: string;
  service: string;
  timestamp: string;
  environment: string;
  version: string;
  uptime: number;
}

/**
 * 헬스체크 출력 포트
 */
export interface HealthCheckPort {
  /**
   * 기본 헬스체크 수행
   */
  performBasicHealthCheck(): Promise<HealthCheckData>;

  /**
   * 상세 헬스체크 수행
   */
  performDetailedHealthCheck(): Promise<HealthCheckData>;

  /**
   * 특정 서비스 헬스체크 수행
   */
  performServiceHealthCheck(serviceType: string): Promise<HealthCheckData>;
} 