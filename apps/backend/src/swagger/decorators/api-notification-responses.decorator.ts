import { applyDecorators, Type } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/response/error-response.dto';
import { Notification } from '../../modules/notifications/entities/notification.entity';

// 알림 생성 API 데코레이터
export const ApiCreateNotification = (bodyType: Type<any>) => {
    return applyDecorators(
        ApiOperation({
            summary: '알림 생성',
            description: '사용자에게 새로운 알림을 생성합니다.',
        }),
        ApiBody({ type: bodyType, description: '알림 생성 데이터' }),
        ApiCreatedResponse({
            description: '알림이 성공적으로 생성됨',
            type: Notification,
        }),
        ApiBadRequestResponse({
            description: '잘못된 입력 데이터',
            type: ErrorResponseDto,
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
        ApiInternalServerErrorResponse({
            description: '서버 내부 오류',
            type: ErrorResponseDto,
        }),
    );
};

// 사용자 알림 조회 API 데코레이터
export const ApiGetUserNotifications = () => {
    return applyDecorators(
        ApiOperation({
            summary: '사용자 알림 조회',
            description: '인증된 사용자의 알림을 조회합니다.',
        }),
        ApiQuery({
            name: 'unreadOnly',
            description: '읽지 않은 알림만 조회',
            type: 'boolean',
            required: false,
            example: false,
        }),
        ApiOkResponse({
            description: '알림이 성공적으로 조회됨',
            type: [Notification],
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
    );
};

// 알림 읽음 처리 API 데코레이터
export const ApiMarkNotificationAsRead = () => {
    return applyDecorators(
        ApiOperation({
            summary: '알림 읽음 처리',
            description: '특정 알림을 읽음으로 표시합니다.',
        }),
        ApiParam({
            name: 'id',
            description: '알림 고유 식별자',
            type: 'string',
            format: 'uuid',
            example: 'uuid-v4-string',
        }),
        ApiOkResponse({
            description: '알림이 읽음으로 표시됨',
            type: Notification,
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
        ApiNotFoundResponse({
            description: '알림을 찾을 수 없습니다',
            type: ErrorResponseDto,
        }),
        ApiForbiddenResponse({
            description: '이 알림에 접근할 권한이 없습니다',
            type: ErrorResponseDto,
        }),
    );
};

// 모든 알림 읽음 처리 API 데코레이터
export const ApiMarkAllNotificationsAsRead = () => {
    return applyDecorators(
        ApiOperation({
            summary: '모든 알림 읽음 처리',
            description: '인증된 사용자의 모든 알림을 읽음으로 표시합니다.',
        }),
        ApiOkResponse({
            description: '모든 알림이 읽음으로 표시됨',
            schema: {
                type: 'object',
                properties: {
                    message: { type: 'string', example: 'All notifications marked as read' },
                },
            },
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
    );
};

// 알림 삭제 API 데코레이터
export const ApiDeleteNotification = () => {
    return applyDecorators(
        ApiOperation({
            summary: '알림 삭제',
            description: '특정 알림을 삭제합니다.',
        }),
        ApiParam({
            name: 'id',
            description: '알림 고유 식별자',
            type: 'string',
            format: 'uuid',
            example: 'uuid-v4-string',
        }),
        ApiOkResponse({
            description: '알림이 성공적으로 삭제됨',
            schema: {
                type: 'object',
                properties: {
                    message: { type: 'string', example: 'Notification deleted successfully' },
                },
            },
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
        ApiNotFoundResponse({
            description: '알림을 찾을 수 없습니다',
            type: ErrorResponseDto,
        }),
        ApiForbiddenResponse({
            description: '이 알림을 삭제할 권한이 없습니다',
            type: ErrorResponseDto,
        }),
    );
};

// 읽지 않은 알림 수 조회 API 데코레이터
export const ApiGetUnreadNotificationCount = () => {
    return applyDecorators(
        ApiOperation({
            summary: '읽지 않은 알림 수 조회',
            description: '인증된 사용자의 읽지 않은 알림 수를 조회합니다.',
        }),
        ApiOkResponse({
            description: '읽지 않은 알림 수가 성공적으로 조회됨',
            schema: {
                type: 'object',
                properties: {
                    unreadCount: { type: 'integer', example: 5 },
                    totalCount: { type: 'integer', example: 10 }
                }
            }
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
    );
};
