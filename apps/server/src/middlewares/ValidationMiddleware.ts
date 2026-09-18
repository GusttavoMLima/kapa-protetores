import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../errors';

export const validateBody = (schema: ZodType) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(AppError.badRequest('Dados inválidos.', result.error.flatten()));
      return;
    }
    req.body = result.data;
    next();
  };
