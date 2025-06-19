import { applyDecorators, Type } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiCreatedResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/response/error-response.dto';
import { User } from '../../modules/users/entities/user.entity';

// 사용자 생성 API 데코레이터
export const ApiCreateUser = (bodyType: Type<any>) => {
    return applyDecorators(
        ApiOperation({
            summary: '사용자 생성',
            description: '새로운 사용자를 생성합니다.',
        }),
        ApiBody({ type: bodyType, description: '사용자 생성 데이터' }),
        ApiCreatedResponse({
            description: '사용자가 성공적으로 생성됨',
            type: User,
        }),
        ApiBadRequestResponse({
            description: '잘못된 요청 데이터',
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

// 사용자 검색 API 데코레이터
export const ApiSearchUsers = () => {
    return applyDecorators(
        ApiOperation({
            summary: '사용자 검색',
            description: '이름 또는 이메일로 사용자를 검색합니다.',
        }),
        ApiQuery({
            name: 'q',
            description: '이름 또는 이메일 검색어',
            type: 'string',
            required: true,
        }),
        ApiQuery({
            name: 'limit',
            description: '반환할 결과 수',
            type: 'integer',
            required: false,
            example: 10,
        }),
        ApiOkResponse({
            description: '검색 결과가 성공적으로 반환됨',
            type: [User],
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

// 활성 사용자 조회 API 데코레이터
export const ApiGetActiveUsers = () => {
    return applyDecorators(
        ApiOperation({
            summary: '활성 사용자 조회',
            description: '모든 활성 사용자를 조회합니다.',
        }),
        ApiOkResponse({
            description: '활성 사용자가 성공적으로 조회됨',
            type: [User],
        }),
        ApiUnauthorizedResponse({
            description: '인증이 필요합니다',
            type: ErrorResponseDto,
        }),
    );
};

// 사용자 상세 조회 API 데코레이터
export const ApiGetUserById = () => {
    return applyDecorators(
        ApiOperation({
            summary: 'ID로 사용자 조회',
            description: '특정 사용자의 상세 정보를 ID로 조회합니다.',
        }),
        ApiParam({
            name: 'id',
            description: '사용자 고유 식별자',
            type: 'string',
            format: 'uuid',
            example: 'uuid-v4-string',
        }),
        ApiOkResponse({
            description: '사용자가 성공적으로 조회됨',
            type: User,
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

// 사용자 정보 수정 API 데코레이터
export const ApiUpdateUser = (bodyType: Type<any>) => {
    return applyDecorators(
        ApiOperation({
            summary: '사용자 정보 수정',
            description: '사용자 정보를 수정합니다.',
        }),
        ApiParam({
            name: 'id',
            description: '사용자 고유 식별자',
            type: 'string',
            format: 'uuid',
            example: 'uuid-v4-string',
        }),
        ApiBody({ type: bodyType, description: '사용자 수정 데이터' }),
        ApiOkResponse({
            description: '사용자 정보가 성공적으로 수정됨',
            type: User,
        }),
        ApiBadRequestResponse({
            description: '잘못된 요청 데이터',
            type: ErrorResponseDto,
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

// 사용자 삭제 API 데코레이터
export const ApiDeleteUser = () => {
    return applyDecorators(
        ApiOperation({
            summary: '사용자 삭제',
            description: '사용자를 삭제합니다.',
        }),
        ApiParam({
            name: 'id',
            description: '사용자 고유 식별자',
            type: 'string',
            format: 'uuid',
            example: 'uuid-v4-string',
        }),
        ApiOkResponse({
            description: '사용자가 성공적으로 삭제됨',
            schema: {
                type: 'object',
                properties: {
                    message: { type: 'string', example: 'User deleted successfully' },
                },
            },
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
