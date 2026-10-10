import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@kapa/shared';
import { UnauthorizedError, ForbiddenError } from '../errors';
import { JwtService } from '../security/JwtService';

export class AuthMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  public authenticate = (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const authorization = req.header('authorization');
      const [scheme, token] = authorization?.split(' ') ?? [];
      if (scheme !== 'Bearer' || !token) throw new UnauthorizedError();
      const payload = this.jwtService.verify(token);
      req.auth = { userId: payload.sub, email: payload.email, role: payload.role };
      next();
    } catch (error) {
      next(error);
    }
  };

  public authorize = (...roles: UserRole[]) =>
    (req: Request, _res: Response, next: NextFunction): void => {
      if (!req.auth) return next(new UnauthorizedError());
      if (!roles.includes(req.auth.role)) return next(new ForbiddenError());
      next();
    };
}
