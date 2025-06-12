import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T = any> {
    success: boolean;
    status: number;
    message: string;
    data: T;
    timestamp: string;
}

/**
 * 표준 응답 형태로 변환하는 인터셉터
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, StandardResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T>> {
        const response = context.switchToHttp().getResponse<Response>();
        const request = context.switchToHttp().getRequest();

        return next.handle().pipe(
            map((data) => {
                const statusCode = response.statusCode;

                // 이미 표준 형태인 경우 그대로 반환
                if (data && typeof data === 'object' && 'success' in data && 'status' in data) {
                    return data;
                }

                // 성공 메시지 생성
                const message = this.getSuccessMessage(request.method, request.path, statusCode);

                return {
                    success: true,
                    status: statusCode,
                    message,
                    data: data || {},
                    timestamp: new Date().toISOString(),
                };
            }),
        );
    }

    private getSuccessMessage(method: string, path: string, statusCode: number): string {
        // 특정 엔드포인트별 메시지
        if (path.includes('/auth/login')) {
            return '로그인이 성공적으로 완료되었습니다.';
        }
        if (path.includes('/auth/register')) {
            return '회원가입이 성공적으로 완료되었습니다.';
        }
        if (path.includes('/projects') && method === 'POST') {
            return '프로젝트가 성공적으로 생성되었습니다.';
        }
        if (path.includes('/projects') && method === 'GET') {
            return '프로젝트 목록을 성공적으로 조회했습니다.';
        }
        if (path.includes('/tasks') && method === 'POST') {
            return '태스크가 성공적으로 생성되었습니다.';
        }
        if (path.includes('/notifications')) {
            return '알림 정보를 성공적으로 조회했습니다.';
        }

        // 일반적인 메시지
        switch (method) {
            case 'POST':
                return statusCode === 201 ? '생성이 성공적으로 완료되었습니다.' : '요청이 성공적으로 처리되었습니다.';
            case 'PUT':
            case 'PATCH':
                return '수정이 성공적으로 완료되었습니다.';
            case 'DELETE':
                return '삭제가 성공적으로 완료되었습니다.';
            case 'GET':
            default:
                return '요청이 성공적으로 처리되었습니다.';
        }
    }
}
