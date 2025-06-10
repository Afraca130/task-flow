import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public 데코레이터
 * 인증이 필요하지 않은 엔드포인트에 사용합니다.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true); 