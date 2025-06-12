import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponseDto } from '../dto/response/api-response.dto';

/**
 * HTTP 예외 필터
 * 모든 HTTP 예외를 일관된 형태로 처리합니다.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    let message = exception.message;
    let details = undefined;

    // 예외 응답이 객체인 경우 메시지와 세부사항 추출
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const errorObj = exceptionResponse as any;
      message = errorObj.message || exception.message;
      if (errorObj.message && Array.isArray(errorObj.message)) {
        details = errorObj.message;
        message = '입력 데이터 검증에 실패했습니다.';
      }
    }

    // 간단한 에러 로그 출력
    this.logger.error(`HTTP Exception [${status}] ${request.method} ${request.url}: ${message}`);

    // 상세 정보가 있는 경우 별도로 로그 출력
    if (details && details.length > 0) {
      this.logger.error(`Validation Details: ${JSON.stringify(details, null, 2)}`);
    }

    const errorResponse = ApiResponseDto.error(
      message,
      {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        details,
      },
    );

    response.status(status).json(errorResponse);
  }
}

/**
 * 전체 예외 필터
 * HTTP 예외가 아닌 모든 예외를 처리합니다.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof Error
      ? exception.message
      : '알 수 없는 오류가 발생했습니다.';

    // 간단한 에러 로그 출력
    this.logger.error(`Unhandled Exception [${status}] ${request.method} ${request.url}: ${message}`);

    const errorResponse = ApiResponseDto.error(
      message,
      {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      },
    );

    response.status(status).json(errorResponse);
  }
}
