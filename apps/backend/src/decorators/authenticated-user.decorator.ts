import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface AuthenticatedUser {
    id: string;
    email: string;
    name: string;
}

export interface AuthenticatedRequest extends Request {
    user: AuthenticatedUser;
}

/**
 * Extract authenticated user from request
 *
 * @example
 * ```typescript
 * @Get('profile')
 * async getProfile(@User() user: AuthenticatedUser) {
 *   return user;
 * }
 *
 * @Get('profile')
 * async getUserId(@User('id') userId: string) {
 *   return { userId };
 * }
 * ```
 */
export const User = createParamDecorator(
    (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext): any => {
        const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
        const user = request.user;

        if (!user) {
            return undefined;
        }

        return data ? user[data] : user;
    },
);
