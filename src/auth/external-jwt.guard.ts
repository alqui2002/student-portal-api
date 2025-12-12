import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import axios from 'axios';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class ExternalJwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
      const response = await axios.post(
        'https://jtseq9puk0.execute-api.us-east-1.amazonaws.com/api/auth/verify-jwt',
        {
          kind: 'access',
          token,
        },
        { headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}`,
      } },
      );

      const data = response.data;

      if (!data || data.valid === false) {
        throw new UnauthorizedException('Invalid token');
      }

      const decoded = jwt.decode(token);

      if (!decoded || typeof decoded === 'string') {
        throw new UnauthorizedException('Invalid token payload');
      }

      req['user'] = decoded;
      req['rawToken'] = token;

      return true;
    } catch (err) {
      console.log('Auth error:', err.response?.data || err.message);
      throw new ForbiddenException('Token verification failed');
    }
  }
}
