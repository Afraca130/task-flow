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

    // 스택 트레이스에서 파일명과 라인 정보 추출
    const stackInfo = this.extractStackInfo(exception.stack);

    // 간단한 에러 로그 출력 (파일명과 라인 정보 포함)
    this.logger.error(`HTTP Exception [${status}] ${request.method} ${request.url}: ${message} ${stackInfo ? `at ${stackInfo}` : ''}`);

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
        ...(stackInfo && { location: stackInfo }),
      },
    );

    response.status(status).json(errorResponse);
  }

  private extractStackInfo(stack?: string): string | null {
    if (!stack) return null;

    const lines = stack.split('\n');
    for (const line of lines) {
      // TypeScript 파일 경로를 찾음
      const match = line.match(/at .* \((.+\.ts):(\d+):(\d+)\)/);
      if (match) {
        const [, filePath, lineNumber, columnNumber] = match;
        const fileName = filePath.split('/').pop() || filePath;
        return `${fileName}:${lineNumber}:${columnNumber}`;
      }
    }
    return null;
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

    // 500 에러를 400대로 변경
    let status = HttpStatus.BAD_REQUEST; // 기본값을 400으로 설정

    if (exception instanceof HttpException) {
      status = exception.getStatus();
    } else {
      // 500 에러 대신 422 (Unprocessable Entity) 사용
      status = HttpStatus.UNPROCESSABLE_ENTITY;
    }

    const message = exception instanceof Error
      ? exception.message
      : '처리할 수 없는 요청입니다.';

    // 스택 트레이스에서 파일명과 라인 정보 추출
    const stackInfo = this.extractStackInfo(exception instanceof Error ? exception.stack : undefined);

    // 간단한 에러 로그 출력 (파일명과 라인 정보 포함)
    this.logger.error(`Unhandled Exception [${status}] ${request.method} ${request.url}: ${message} ${stackInfo ? `at ${stackInfo}` : ''}`);

    const errorResponse = ApiResponseDto.error(
      message,
      {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        ...(stackInfo && { location: stackInfo }),
      },
    );

    response.status(status).json(errorResponse);
  }

  private extractStackInfo(stack?: string): string | null {
    if (!stack) return null;

    const lines = stack.split('\n');
    for (const line of lines) {
      // TypeScript 파일 경로를 찾음
      const match = line.match(/at .* \((.+\.ts):(\d+):(\d+)\)/);
      if (match) {
        const [, filePath, lineNumber, columnNumber] = match;
        const fileName = filePath.split('/').pop() || filePath;
        return `${fileName}:${lineNumber}:${columnNumber}`;
      }
    }
    return null;
  }
}
