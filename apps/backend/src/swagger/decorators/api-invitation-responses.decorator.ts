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
import { InvitationStatus } from '../../invitations/entities/project-invitation.entity';

// 초대 생성 API 데코레이터
export const ApiCreateInvitation = (bodyType: Type<any>) => {
    return applyDecorators(
        ApiOperation({
            summary: '프로젝트 초대 생성',
            description: '새로운 프로젝트 초대를 생성합니다. 이메일 또는 사용자 ID로 초대할 수 있습니다.',
        }),
        ApiBody({ type: bodyType, description: '초대 생성 데이터' }),
        ApiCreatedResponse({
            description: '초대가 성공적으로 생성되어 이메일로 발송됨',
            schema: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid', example: 'uuid-v4-string' },
                    token: { type: 'string', example: 'invitation-token-string' },
                    message: { type: 'string', example: '초대가 성공적으로 전송되었습니다' },
                },
            },
        }),
        ApiBadRequestResponse({
            description: '잘못된 요청 데이터 (이메일/사용자ID 누락, 유효성 검사 실패)',
            type: ErrorResponseDto,
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
        ApiNotFoundResponse({
            description: '프로젝트 또는 사용자를 찾을 수 없습니다',
            type: ErrorResponseDto,
        }),
        ApiInternalServerErrorResponse({
            description: '서버 내부 오류 (이메일 전송 실패 등)',
            type: ErrorResponseDto,
        }),
    );
};

// 초대 수락 API 데코레이터
export const ApiAcceptInvitation = () => {
    return applyDecorators(
        ApiOperation({
            summary: '초대 수락',
            description: '프로젝트 초대를 수락하여 프로젝트 멤버가 됩니다.',
        }),
        ApiParam({
            name: 'token',
            description: '초대 토큰',
            type: 'string',
            example: 'invitation-token-string',
        }),
        ApiOkResponse({
            description: '초대가 성공적으로 수락되어 프로젝트 멤버가 됨',
            schema: {
                type: 'object',
                properties: {
                    message: { type: 'string', example: '초대를 수락했습니다' },
                    projectId: { type: 'string', format: 'uuid', example: 'uuid-v4-string' },
                    memberId: { type: 'string', format: 'uuid', example: 'uuid-v4-string' },
                },
            },
        }),
        ApiBadRequestResponse({
            description: '초대가 만료되었거나 이미 처리되었습니다',
            type: ErrorResponseDto,
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
        ApiNotFoundResponse({
            description: '초대를 찾을 수 없습니다',
            type: ErrorResponseDto,
        }),
    );
};

// 초대 거절 API 데코레이터
export const ApiDeclineInvitation = () => {
    return applyDecorators(
        ApiOperation({
            summary: '초대 거절',
            description: '프로젝트 초대를 거절합니다.',
        }),
        ApiParam({
            name: 'token',
            description: '초대 토큰',
            type: 'string',
            example: 'invitation-token-string',
        }),
        ApiOkResponse({
            description: '초대가 성공적으로 거절됨',
            schema: {
                type: 'object',
                properties: {
                    message: { type: 'string', example: '초대를 거절했습니다' },
                },
            },
        }),
        ApiBadRequestResponse({
            description: '초대가 만료되었거나 이미 처리되었습니다',
            type: ErrorResponseDto,
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
        ApiNotFoundResponse({
            description: '초대를 찾을 수 없습니다',
            type: ErrorResponseDto,
        }),
    );
};

// 초대 정보 조회 API 데코레이터
export const ApiGetInvitation = () => {
    return applyDecorators(
        ApiOperation({
            summary: '초대 정보 조회',
            description: '토큰으로 초대 정보를 조회합니다. 초대 수락/거절 전에 초대 내용을 확인할 때 사용합니다.',
        }),
        ApiParam({
            name: 'token',
            description: '초대 토큰',
            type: 'string',
            example: 'invitation-token-string',
        }),
        ApiOkResponse({
            description: '초대 정보 조회 성공',
            schema: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    projectName: { type: 'string', example: 'TaskFlow 프로젝트' },
                    inviterName: { type: 'string', example: '김개발' },
                    message: { type: 'string', example: '프로젝트에 참여해주세요!' },
                    status: { type: 'string', enum: Object.values(InvitationStatus) },
                    expiresAt: { type: 'string', format: 'date-time' },
                },
            },
        }),
        ApiNotFoundResponse({
            description: '초대를 찾을 수 없거나 만료되었습니다',
            type: ErrorResponseDto,
        }),
    );
};

// 받은 초대 목록 조회 API 데코레이터
export const ApiGetReceivedInvitations = () => {
    return applyDecorators(
        ApiOperation({
            summary: '받은 초대 목록 조회',
            description: '사용자가 받은 초대 목록을 조회합니다. 상태별 필터링이 가능합니다.',
        }),
        ApiQuery({
            name: 'status',
            description: '초대 상태로 필터링',
            enum: InvitationStatus,
            required: false,
            example: InvitationStatus.PENDING,
        }),
        ApiOkResponse({
            description: '받은 초대 목록 조회 성공',
            schema: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        projectName: { type: 'string', example: 'TaskFlow 프로젝트' },
                        inviterName: { type: 'string', example: '김개발' },
                        message: { type: 'string', example: '프로젝트에 참여해주세요!' },
                        status: { type: 'string', enum: Object.values(InvitationStatus) },
                        createdAt: { type: 'string', format: 'date-time' },
                        expiresAt: { type: 'string', format: 'date-time' },
                    },
                },
            },
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
    );
};

// 프로젝트 초대 목록 조회 API 데코레이터
export const ApiGetProjectInvitations = () => {
    return applyDecorators(
        ApiOperation({
            summary: '프로젝트 초대 목록 조회',
            description: '특정 프로젝트의 모든 초대 목록을 조회합니다. 프로젝트 소유자 또는 관리자만 접근 가능합니다.',
        }),
        ApiParam({
            name: 'projectId',
            description: '프로젝트 ID',
            type: 'string',
            format: 'uuid',
            example: 'uuid-v4-string',
        }),
        ApiOkResponse({
            description: '프로젝트 초대 목록 조회 성공',
            schema: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        inviteeEmail: { type: 'string', format: 'email' },
                        inviteeName: { type: 'string', example: '이사용자' },
                        status: { type: 'string', enum: Object.values(InvitationStatus) },
                        createdAt: { type: 'string', format: 'date-time' },
                        expiresAt: { type: 'string', format: 'date-time' },
                    },
                },
            },
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
        ApiForbiddenResponse({
            description: '프로젝트 초대 목록을 볼 권한이 없습니다',
            type: ErrorResponseDto,
        }),
    );
};

// 초대 삭제 API 데코레이터
export const ApiDeleteInvitation = () => {
    return applyDecorators(
        ApiOperation({
            summary: '초대 삭제',
            description: '초대를 삭제합니다. 초대를 보낸 사용자만 삭제할 수 있습니다.',
        }),
        ApiParam({
            name: 'id',
            description: '초대 ID',
            type: 'string',
            format: 'uuid',
            example: 'uuid-v4-string',
        }),
        ApiOkResponse({
            description: '초대가 성공적으로 삭제됨',
            schema: {
                type: 'object',
                properties: {
                    message: { type: 'string', example: '초대가 성공적으로 삭제되었습니다' },
                },
            },
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
        ApiForbiddenResponse({
            description: '자신이 보낸 초대만 삭제할 수 있습니다',
            type: ErrorResponseDto,
        }),
        ApiNotFoundResponse({
            description: '초대를 찾을 수 없습니다',
            type: ErrorResponseDto,
        }),
    );
};
