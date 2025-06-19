import { applyDecorators, Type } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiConflictResponse,
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
import { ProjectResponseDto } from '../../modules/projects/dto/response/project-response.dto';

// 프로젝트 생성 API 데코레이터
export const ApiCreateProject = (bodyType: Type<any>) => {
    return applyDecorators(
        ApiOperation({
            summary: '프로젝트 생성',
            description: '새로운 프로젝트를 생성합니다. 생성한 사용자가 프로젝트 소유자가 됩니다.',
        }),
        ApiBody({ type: bodyType, description: '프로젝트 생성 데이터' }),
        ApiCreatedResponse({
            description: '프로젝트가 성공적으로 생성됨',
            type: ProjectResponseDto,
        }),
        ApiBadRequestResponse({
            description: '잘못된 요청 데이터 (유효성 검사 실패)',
            type: ErrorResponseDto,
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
        ApiConflictResponse({
            description: '동일한 이름의 프로젝트가 이미 존재합니다',
            type: ErrorResponseDto,
        }),
        ApiInternalServerErrorResponse({
            description: '서버 내부 오류',
            type: ErrorResponseDto,
        }),
    );
};

// 프로젝트 목록 조회 API 데코레이터
export const ApiGetProjects = () => {
    return applyDecorators(
        ApiOperation({
            summary: '프로젝트 목록 조회',
            description: '사용자가 참여 중인 프로젝트 목록을 조회합니다. 페이지네이션과 검색을 지원합니다.',
        }),
        ApiQuery({
            name: 'page',
            description: '페이지 번호 (1부터 시작)',
            type: 'integer',
            example: 1,
            required: false,
        }),
        ApiQuery({
            name: 'limit',
            description: '페이지당 항목 수',
            type: 'integer',
            example: 10,
            required: false,
        }),
        ApiQuery({
            name: 'search',
            description: '프로젝트 이름 검색어',
            type: 'string',
            example: 'TaskFlow',
            required: false,
        }),
        ApiQuery({
            name: 'isActive',
            description: '활성 프로젝트만 조회',
            type: 'boolean',
            example: true,
            required: false,
        }),
        ApiOkResponse({
            description: '프로젝트 목록 조회 성공',
            schema: {
                type: 'object',
                properties: {
                    data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ProjectResponseDto' },
                    },
                    meta: {
                        type: 'object',
                        properties: {
                            page: { type: 'integer', example: 1 },
                            limit: { type: 'integer', example: 10 },
                            total: { type: 'integer', example: 25 },
                            totalPages: { type: 'integer', example: 3 },
                        },
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

// 프로젝트 상세 조회 API 데코레이터
export const ApiGetProject = () => {
    return applyDecorators(
        ApiOperation({
            summary: '프로젝트 상세 조회',
            description: '특정 프로젝트의 상세 정보를 조회합니다. 프로젝트 멤버만 접근 가능합니다.',
        }),
        ApiParam({
            name: 'id',
            description: '프로젝트 고유 식별자',
            type: 'string',
            format: 'uuid',
            example: 'uuid-v4-string',
        }),
        ApiOkResponse({
            description: '프로젝트 상세 정보 조회 성공',
            type: ProjectResponseDto,
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
        ApiForbiddenResponse({
            description: '프로젝트에 접근할 권한이 없습니다',
            type: ErrorResponseDto,
        }),
        ApiNotFoundResponse({
            description: '프로젝트를 찾을 수 없습니다',
            type: ErrorResponseDto,
        }),
    );
};

// 프로젝트 수정 API 데코레이터
export const ApiUpdateProject = (bodyType: Type<any>) => {
    return applyDecorators(
        ApiOperation({
            summary: '프로젝트 정보 수정',
            description: '프로젝트 정보를 수정합니다. 프로젝트 소유자 또는 관리자만 수정 가능합니다.',
        }),
        ApiParam({
            name: 'id',
            description: '프로젝트 고유 식별자',
            type: 'string',
            format: 'uuid',
            example: 'uuid-v4-string',
        }),
        ApiBody({ type: bodyType, description: '프로젝트 수정 데이터' }),
        ApiOkResponse({
            description: '프로젝트 정보가 성공적으로 수정됨',
            type: ProjectResponseDto,
        }),
        ApiBadRequestResponse({
            description: '잘못된 요청 데이터 (유효성 검사 실패)',
            type: ErrorResponseDto,
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
        ApiForbiddenResponse({
            description: '프로젝트를 수정할 권한이 없습니다',
            type: ErrorResponseDto,
        }),
        ApiNotFoundResponse({
            description: '프로젝트를 찾을 수 없습니다',
            type: ErrorResponseDto,
        }),
        ApiConflictResponse({
            description: '동일한 이름의 프로젝트가 이미 존재합니다',
            type: ErrorResponseDto,
        }),
    );
};

// 프로젝트 삭제 API 데코레이터
export const ApiDeleteProject = () => {
    return applyDecorators(
        ApiOperation({
            summary: '프로젝트 삭제',
            description: '프로젝트를 삭제합니다. 프로젝트 소유자만 삭제 가능하며, 관련된 모든 데이터가 함께 삭제됩니다.',
        }),
        ApiParam({
            name: 'id',
            description: '프로젝트 고유 식별자',
            type: 'string',
            format: 'uuid',
            example: 'uuid-v4-string',
        }),
        ApiOkResponse({
            description: '프로젝트가 성공적으로 삭제됨',
            schema: {
                type: 'object',
                properties: {
                    message: { type: 'string', example: '프로젝트가 성공적으로 삭제되었습니다' },
                },
            },
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
        ApiForbiddenResponse({
            description: '프로젝트를 삭제할 권한이 없습니다 (소유자만 삭제 가능)',
            type: ErrorResponseDto,
        }),
        ApiNotFoundResponse({
            description: '프로젝트를 찾을 수 없습니다',
            type: ErrorResponseDto,
        }),
    );
};
