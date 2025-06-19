import { applyDecorators } from '@nestjs/common';
import {
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/response/error-response.dto';
import { ActivityLog } from '../../modules/activity-logs/entities/activity-log.entity';

// 프로젝트 활동 로그 조회 API 데코레이터
export const ApiGetProjectActivityLogs = () => {
    return applyDecorators(
        ApiOperation({
            summary: '프로젝트 활동 로그 조회',
            description: '특정 프로젝트의 활동 로그를 조회합니다.',
        }),
        ApiParam({
            name: 'projectId',
            description: '프로젝트 고유 식별자',
            type: 'string',
            format: 'uuid',
            example: 'uuid-v4-string',
        }),
        ApiQuery({
            name: 'limit',
            description: '조회할 로그 수',
            type: 'integer',
            required: false,
            example: 50,
        }),
        ApiQuery({
            name: 'offset',
            description: '건너뛸 로그 수',
            type: 'integer',
            required: false,
            example: 0,
        }),
        ApiOkResponse({
            description: '활동 로그가 성공적으로 조회됨',
            type: [ActivityLog],
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

// 사용자 활동 로그 조회 API 데코레이터
export const ApiGetUserActivityLogs = () => {
    return applyDecorators(
        ApiOperation({
            summary: '사용자 활동 로그 조회',
            description: '특정 사용자의 활동 로그를 조회합니다.',
        }),
        ApiParam({
            name: 'userId',
            description: '사용자 고유 식별자',
            type: 'string',
            format: 'uuid',
            example: 'uuid-v4-string',
        }),
        ApiQuery({
            name: 'limit',
            description: '조회할 로그 수',
            type: 'integer',
            required: false,
            example: 50,
        }),
        ApiQuery({
            name: 'offset',
            description: '건너뛸 로그 수',
            type: 'integer',
            required: false,
            example: 0,
        }),
        ApiOkResponse({
            description: '활동 로그가 성공적으로 조회됨',
            type: [ActivityLog],
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
    );
};

// 활동 로그 조회 API 데코레이터
export const ApiGetActivityLogs = () => {
    return applyDecorators(
        ApiOperation({
            summary: '활동 로그 조회',
            description: '선택적 필터링과 함께 활동 로그를 조회합니다.',
        }),
        ApiQuery({
            name: 'limit',
            description: '조회할 로그 수',
            type: 'integer',
            required: false,
            example: 20,
        }),
        ApiQuery({
            name: 'projectId',
            description: '프로젝트 ID로 필터링',
            type: 'string',
            required: false,
        }),
        ApiOkResponse({
            description: '활동 로그가 성공적으로 조회됨',
            type: [ActivityLog],
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
    );
};

// 최근 활동 로그 조회 API 데코레이터
export const ApiGetRecentActivityLogs = () => {
    return applyDecorators(
        ApiOperation({
            summary: '최근 활동 로그 조회',
            description: '인증된 사용자의 최근 활동 로그를 조회합니다.',
        }),
        ApiQuery({
            name: 'limit',
            description: '조회할 로그 수',
            type: 'integer',
            required: false,
            example: 20,
        }),
        ApiQuery({
            name: 'projectId',
            description: '프로젝트 ID로 필터링',
            type: 'string',
            required: false,
        }),
        ApiOkResponse({
            description: '최근 활동 로그가 성공적으로 조회됨',
            type: [ActivityLog],
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
    );
};

// 활동 로그 검색 API 데코레이터
export const ApiSearchActivityLogs = () => {
    return applyDecorators(
        ApiOperation({
            summary: '활동 로그 검색',
            description: '키워드로 활동 로그를 검색합니다.',
        }),
        ApiQuery({
            name: 'q',
            description: '검색 키워드',
            type: 'string',
            required: true,
        }),
        ApiQuery({
            name: 'projectId',
            description: '프로젝트 ID로 필터링',
            type: 'string',
            required: false,
        }),
        ApiQuery({
            name: 'userId',
            description: '사용자 ID로 필터링',
            type: 'string',
            required: false,
        }),
        ApiQuery({
            name: 'limit',
            description: '조회할 로그 수',
            type: 'integer',
            required: false,
            example: 20,
        }),
        ApiOkResponse({
            description: '검색 결과가 성공적으로 반환됨',
            type: [ActivityLog],
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
    );
};

// 활동 로그 상세 조회 API 데코레이터
export const ApiGetActivityLogById = () => {
    return applyDecorators(
        ApiOperation({
            summary: '활동 로그 상세 조회',
            description: 'ID로 특정 활동 로그의 상세 정보를 조회합니다.',
        }),
        ApiParam({
            name: 'id',
            description: '활동 로그 고유 식별자',
            type: 'string',
            format: 'uuid',
            example: 'uuid-v4-string',
        }),
        ApiOkResponse({
            description: '활동 로그가 성공적으로 조회됨',
            type: ActivityLog,
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
        ApiNotFoundResponse({
            description: '활동 로그를 찾을 수 없습니다',
            type: ErrorResponseDto,
        }),
        ApiInternalServerErrorResponse({
            description: '서버 내부 오류',
            type: ErrorResponseDto,
        }),
    );
};
