import { UserJwt } from '@kapa/shared';

declare global {
  namespace Express {
    interface Request {
      user?: UserJwt;
    }
  }
}
