import { applyDecorators, Type } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiOperation,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/response/error-response.dto';
import { LoginResponseDto, RegisterResponseDto, UserDto } from '../../modules/auth/dto/auth-response.dto';

// 회원가입 API 데코레이터
export const ApiRegister = (bodyType: Type<any>) => {
    return applyDecorators(
        ApiOperation({
            summary: '회원가입',
            description: '새로운 사용자 계정을 생성합니다.',
        }),
        ApiBody({ type: bodyType, description: '회원가입 데이터' }),
        ApiCreatedResponse({
            description: '회원가입 성공',
            type: RegisterResponseDto,
        }),
        ApiBadRequestResponse({
            description: '잘못된 요청 데이터',
            type: ErrorResponseDto,
        }),
        ApiConflictResponse({
            description: '이미 존재하는 이메일',
            type: ErrorResponseDto,
        }),
        ApiInternalServerErrorResponse({
            description: '서버 내부 오류',
            type: ErrorResponseDto,
        }),
    );
};

// 로그인 API 데코레이터
export const ApiLogin = (bodyType: Type<any>) => {
    return applyDecorators(
        ApiOperation({
            summary: '로그인',
            description: '사용자 인증을 수행하고 JWT 토큰을 발급합니다.',
        }),
        ApiBody({ type: bodyType, description: '로그인 데이터' }),
        ApiOkResponse({
            description: '로그인 성공',
            type: LoginResponseDto,
        }),
        ApiUnauthorizedResponse({
            description: '인증 실패',
            type: ErrorResponseDto,
        }),
        ApiInternalServerErrorResponse({
            description: '서버 내부 오류',
            type: ErrorResponseDto,
        }),
    );
};

// 프로필 조회 API 데코레이터
export const ApiGetProfile = () => {
    return applyDecorators(
        ApiOperation({
            summary: '프로필 조회',
            description: '현재 로그인한 사용자의 프로필 정보를 조회합니다.',
        }),
        ApiOkResponse({
            description: '프로필 조회 성공',
            type: UserDto,
        }),
        ApiUnauthorizedResponse({
            description: '인증 필요',
            type: ErrorResponseDto,
        }),
    );
};

// 프로필 업데이트 API 데코레이터
export const ApiUpdateProfile = (bodyType: Type<any>) => {
    return applyDecorators(
        ApiOperation({
            summary: '프로필 업데이트',
            description: '현재 로그인한 사용자의 프로필 정보를 업데이트합니다.',
        }),
        ApiBody({ type: bodyType, description: '프로필 업데이트 데이터' }),
        ApiOkResponse({
            description: '프로필 업데이트 성공',
            type: UserDto,
        }),
        ApiBadRequestResponse({
            description: '잘못된 요청 데이터',
            type: ErrorResponseDto,
        }),
        ApiUnauthorizedResponse({
            description: '인증 필요',
            type: ErrorResponseDto,
        }),
    );
};

// 비밀번호 변경 API 데코레이터
export const ApiChangePassword = (bodyType: Type<any>) => {
    return applyDecorators(
        ApiOperation({
            summary: '비밀번호 변경',
            description: '현재 로그인한 사용자의 비밀번호를 변경합니다.',
        }),
        ApiBody({ type: bodyType, description: '비밀번호 변경 데이터' }),
        ApiOkResponse({
            description: '비밀번호 변경 성공',
            schema: {
                type: 'object',
                properties: {
                    message: { type: 'string', example: '비밀번호가 성공적으로 변경되었습니다.' },
                },
            },
        }),
        ApiBadRequestResponse({
            description: '잘못된 요청 데이터',
            type: ErrorResponseDto,
        }),
        ApiUnauthorizedResponse({
            description: '인증 실패',
            type: ErrorResponseDto,
        }),
    );
};

// 토큰 새로고침 API 데코레이터
export const ApiRefreshToken = (bodyType: Type<any>) => {
    return applyDecorators(
        ApiOperation({
            summary: '토큰 새로고침',
            description: '리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급받습니다.',
        }),
        ApiBody({ type: bodyType, description: '리프레시 토큰 정보' }),
        ApiCreatedResponse({
            description: '토큰 새로고침 성공',
            type: LoginResponseDto,
        }),
        ApiUnauthorizedResponse({
            description: '유효하지 않은 리프레시 토큰',
            type: ErrorResponseDto,
        }),
        ApiInternalServerErrorResponse({
            description: '서버 내부 오류',
            type: ErrorResponseDto,
        }),
    );
};
