import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 공개 엔드포인트를 표시하는 데코레이터
 * 이 데코레이터가 적용된 엔드포인트는 JWT 인증을 거치지 않습니다.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
