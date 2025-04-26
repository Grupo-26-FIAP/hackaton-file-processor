import { ExecutionContext, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export const GetCurrentUserId = createParamDecorator(
  (_: undefined, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest();
    if (request.headers.authorization) {
      const decoded = jwt.decode(
        request.headers.authorization.split(' ')[1],
      ) as IAuthToken;


      if(!(decoded.username?.length > 0)) {
        throw new UnauthorizedException('Invalid token');
      }


      return decoded.username;
    }

    return null;
  },
);

export interface IAuthToken {
  username: string;
}
