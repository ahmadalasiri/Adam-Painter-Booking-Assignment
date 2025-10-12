import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '../types/jwt-payload.type';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    return request.user;
  },
);
