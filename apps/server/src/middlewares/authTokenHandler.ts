import type { Request, Response, NextFunction } from 'express';
import { Jwt } from '../utils/Jwt';

export function authTokenHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Authentication token is required',
    });
  }

  const [payload, isValid] = Jwt.verify(token);

  if (!isValid) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = payload as Express.Request['user'];

  next();
}
