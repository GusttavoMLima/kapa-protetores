import type { UserRole, UserJwt } from '@kapa/shared';

declare global {
  namespace Express {
    interface Request {
      user?: UserJwt;
      auth?: {
        userId: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export {};
