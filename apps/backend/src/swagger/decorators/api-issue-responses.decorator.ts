import { applyDecorators, Type } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/response/error-response.dto';
import { Issue, IssueType } from '../../modules/issues/entities/issue.entity';

// 이슈 목록 조회 API 데코레이터
export const ApiGetIssues = () => {
    return applyDecorators(
        ApiOperation({
            summary: '이슈 목록 조회',
            description: '페이지네이션을 지원하는 모든 이슈를 조회합니다.',
        }),
        ApiQuery({
            name: 'page',
            description: '페이지 번호',
            type: 'integer',
            required: false,
            example: 1,
        }),
        ApiQuery({
            name: 'limit',
            description: '페이지당 항목 수',
            type: 'integer',
            required: false,
            example: 10,
        }),
        ApiOkResponse({
            description: '이슈 목록이 성공적으로 조회됨',
            schema: {
                type: 'object',
                properties: {
                    data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Issue' },
                    },
                    total: { type: 'integer', example: 100 },
                    page: { type: 'integer', example: 1 },
                    limit: { type: 'integer', example: 10 },
                },
            },
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
    );
};

// 이슈 생성 API 데코레이터
export const ApiCreateIssue = (bodyType: Type<any>) => {
    return applyDecorators(
        ApiOperation({
            summary: '이슈 생성',
            description: '프로젝트에 새로운 이슈를 생성합니다.',
        }),
        ApiBody({ type: bodyType, description: '이슈 생성 데이터' }),
        ApiCreatedResponse({
            description: '이슈가 성공적으로 생성됨',
            type: Issue,
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
            description: '프로젝트를 찾을 수 없습니다',
            type: ErrorResponseDto,
        }),
    );
};

// 멘션과 함께 이슈 생성 API 데코레이터
export const ApiCreateIssueWithMentions = () => {
    return applyDecorators(
        ApiOperation({
            summary: '멘션과 함께 이슈 생성',
            description: '프로젝트에 새로운 이슈를 생성하고 멘션 알림을 전송합니다.',
        }),
        ApiBody({
            schema: {
                type: 'object',
                properties: {
                    issue: { $ref: '#/components/schemas/CreateIssueDto' },
                    mentionedUserIds: {
                        type: 'array',
                        items: { type: 'string' },
                        description: '멘션할 사용자 ID 배열'
                    }
                },
                required: ['issue']
            }
        }),
        ApiCreatedResponse({
            description: '멘션과 함께 이슈가 성공적으로 생성됨',
            type: Issue,
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
            description: '프로젝트를 찾을 수 없습니다',
            type: ErrorResponseDto,
        }),
    );
};

// 이슈 상세 조회 API 데코레이터
export const ApiGetIssueById = () => {
    return applyDecorators(
        ApiOperation({
            summary: 'ID로 이슈 조회',
            description: '특정 이슈의 상세 정보를 ID로 조회합니다.',
        }),
        ApiParam({
            name: 'id',
            description: '이슈 고유 식별자',
            type: 'string',
            format: 'uuid',
            example: 'uuid-v4-string',
        }),
        ApiOkResponse({
            description: '이슈가 성공적으로 조회됨',
            type: Issue,
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
        ApiNotFoundResponse({
            description: '이슈를 찾을 수 없습니다',
            type: ErrorResponseDto,
        }),
    );
};

// 이슈 수정 API 데코레이터
export const ApiUpdateIssue = (bodyType: Type<any>) => {
    return applyDecorators(
        ApiOperation({
            summary: '이슈 수정',
            description: '기존 이슈의 정보를 수정합니다.',
        }),
        ApiParam({
            name: 'id',
            description: '이슈 고유 식별자',
            type: 'string',
            format: 'uuid',
            example: 'uuid-v4-string',
        }),
        ApiBody({ type: bodyType, description: '이슈 수정 데이터' }),
        ApiOkResponse({
            description: '이슈가 성공적으로 수정됨',
            type: Issue,
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
            description: '이슈를 찾을 수 없습니다',
            type: ErrorResponseDto,
        }),
    );
};

// 이슈 삭제 API 데코레이터
export const ApiDeleteIssue = () => {
    return applyDecorators(
        ApiOperation({
            summary: '이슈 삭제',
            description: '이슈를 삭제합니다.',
        }),
        ApiParam({
            name: 'id',
            description: '이슈 고유 식별자',
            type: 'string',
            format: 'uuid',
            example: 'uuid-v4-string',
        }),
        ApiOkResponse({
            description: '이슈가 성공적으로 삭제됨',
            schema: {
                type: 'object',
                properties: {
                    message: { type: 'string', example: 'Issue deleted successfully' },
                },
            },
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
        ApiNotFoundResponse({
            description: '이슈를 찾을 수 없습니다',
            type: ErrorResponseDto,
        }),
    );
};

// 프로젝트별 이슈 조회 API 데코레이터
export const ApiGetIssuesByProject = () => {
    return applyDecorators(
        ApiOperation({
            summary: '프로젝트별 이슈 조회',
            description: '특정 프로젝트의 모든 이슈를 조회합니다.',
        }),
        ApiParam({
            name: 'projectId',
            description: '프로젝트 고유 식별자',
            type: 'string',
            format: 'uuid',
            example: 'uuid-v4-string',
        }),
        ApiOkResponse({
            description: '프로젝트 이슈가 성공적으로 조회됨',
            type: [Issue],
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
        ApiNotFoundResponse({
            description: '프로젝트를 찾을 수 없습니다',
            type: ErrorResponseDto,
        }),
    );
};

// 작성자별 이슈 조회 API 데코레이터
export const ApiGetIssuesByAuthor = () => {
    return applyDecorators(
        ApiOperation({
            summary: '작성자별 이슈 조회',
            description: '특정 사용자가 작성한 모든 이슈를 조회합니다.',
        }),
        ApiParam({
            name: 'userId',
            description: '사용자 고유 식별자',
            type: 'string',
            format: 'uuid',
            example: 'uuid-v4-string',
        }),
        ApiOkResponse({
            description: '작성자 이슈가 성공적으로 조회됨',
            type: [Issue],
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
        ApiNotFoundResponse({
            description: '사용자를 찾을 수 없습니다',
            type: ErrorResponseDto,
        }),
    );
};

// 이슈 검색 API 데코레이터
export const ApiSearchIssues = () => {
    return applyDecorators(
        ApiOperation({
            summary: '이슈 검색',
            description: '제목 또는 내용으로 이슈를 검색합니다.',
        }),
        ApiQuery({
            name: 'q',
            description: '검색어',
            type: 'string',
            required: true,
        }),
        ApiQuery({
            name: 'projectId',
            description: '특정 프로젝트 내에서 검색',
            type: 'string',
            required: false,
        }),
        ApiOkResponse({
            description: '검색 결과가 성공적으로 반환됨',
            type: [Issue],
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
        ApiBadRequestResponse({
            description: '검색어가 필요합니다',
            type: ErrorResponseDto,
        }),
    );
};

// 필터링된 이슈 조회 API 데코레이터
export const ApiGetIssuesWithFilters = () => {
    return applyDecorators(
        ApiOperation({
            summary: '필터링된 이슈 조회',
            description: '다양한 조건으로 필터링된 이슈를 조회합니다.',
        }),
        ApiQuery({
            name: 'projectId',
            description: '프로젝트 ID로 필터링',
            type: 'string',
            required: false,
        }),
        ApiQuery({
            name: 'type',
            description: '이슈 타입으로 필터링',
            enum: IssueType,
            required: false,
        }),
        ApiQuery({
            name: 'authorId',
            description: '작성자 ID로 필터링',
            type: 'string',
            required: false,
        }),
        ApiOkResponse({
            description: '필터링된 이슈가 성공적으로 조회됨',
            type: [Issue],
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
    );
};
