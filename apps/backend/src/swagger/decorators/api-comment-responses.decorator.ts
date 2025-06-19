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
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/response/error-response.dto';
import { CommentResponseDto } from '../../modules/tasks/comments/dto/response';

// 댓글 생성 API 데코레이터
export const ApiCreateComment = (bodyType: Type<any>) => {
    return applyDecorators(
        ApiOperation({
            summary: '댓글 생성',
            description: '작업에 새로운 댓글을 생성합니다.',
        }),
        ApiBody({ type: bodyType, description: '댓글 생성 데이터' }),
        ApiCreatedResponse({
            description: '댓글이 성공적으로 생성됨',
            type: CommentResponseDto,
        }),
        ApiBadRequestResponse({
            description: '잘못된 입력 데이터',
            type: ErrorResponseDto,
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
        ApiNotFoundResponse({
            description: '작업을 찾을 수 없습니다',
            type: ErrorResponseDto,
        }),
        ApiInternalServerErrorResponse({
            description: '서버 내부 오류',
            type: ErrorResponseDto,
        }),
    );
};

// 작업별 댓글 조회 API 데코레이터
export const ApiGetTaskComments = () => {
    return applyDecorators(
        ApiOperation({
            summary: '작업별 댓글 조회',
            description: '특정 작업의 모든 댓글을 조회합니다.',
        }),
        ApiParam({
            name: 'taskId',
            description: '작업 고유 식별자',
            type: 'string',
            format: 'uuid',
            example: 'uuid-v4-string',
        }),
        ApiOkResponse({
            description: '댓글이 성공적으로 조회됨',
            type: [CommentResponseDto],
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
        ApiNotFoundResponse({
            description: '작업을 찾을 수 없습니다',
            type: ErrorResponseDto,
        }),
    );
};

// 댓글 수정 API 데코레이터
export const ApiUpdateComment = (bodyType: Type<any>) => {
    return applyDecorators(
        ApiOperation({
            summary: '댓글 수정',
            description: '기존 댓글을 수정합니다 (작성자만 가능).',
        }),
        ApiParam({
            name: 'id',
            description: '댓글 고유 식별자',
            type: 'string',
            format: 'uuid',
            example: 'uuid-v4-string',
        }),
        ApiBody({ type: bodyType, description: '댓글 수정 데이터' }),
        ApiOkResponse({
            description: '댓글이 성공적으로 수정됨',
            type: CommentResponseDto,
        }),
        ApiBadRequestResponse({
            description: '잘못된 입력 데이터',
            type: ErrorResponseDto,
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
        ApiForbiddenResponse({
            description: '권한 없음 - 작성자가 아님',
            type: ErrorResponseDto,
        }),
        ApiNotFoundResponse({
            description: '댓글을 찾을 수 없습니다',
            type: ErrorResponseDto,
        }),
    );
};

// 댓글 삭제 API 데코레이터
export const ApiDeleteComment = () => {
    return applyDecorators(
        ApiOperation({
            summary: '댓글 삭제',
            description: '댓글을 삭제합니다 (작성자만 가능).',
        }),
        ApiParam({
            name: 'id',
            description: '댓글 고유 식별자',
            type: 'string',
            format: 'uuid',
            example: 'uuid-v4-string',
        }),
        ApiOkResponse({
            description: '댓글이 성공적으로 삭제됨',
            schema: {
                type: 'object',
                properties: {
                    message: { type: 'string', example: 'Comment deleted successfully' },
                },
            },
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
        ApiForbiddenResponse({
            description: '권한 없음 - 작성자가 아님',
            type: ErrorResponseDto,
        }),
        ApiNotFoundResponse({
            description: '댓글을 찾을 수 없습니다',
            type: ErrorResponseDto,
        }),
    );
};
