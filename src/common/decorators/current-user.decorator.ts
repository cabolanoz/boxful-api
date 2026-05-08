import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PublicUser } from '../../users/users.service';

interface RequestWithUser {
  user: PublicUser;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): PublicUser => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    return request.user;
  },
);
