import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
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
    const error = typeof exceptionResponse === 'string' 
      ? { message: exceptionResponse }
      : exceptionResponse;

    this.logger.error(
      `HTTP Exception: ${exception.message}`,
      exception.stack,
    );

    const errorResponse = ApiResponseDto.error(
      exception.message,
      {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        error,
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

    this.logger.error(
      `Unhandled Exception: ${message}`,
      exception instanceof Error ? exception.stack : exception,
    );

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