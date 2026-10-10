import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { BadRequestError } from '../errors';

export const validateBody = (schema: ZodType) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new BadRequestError('Dados inválidos.', result.error.flatten()));
      return;
    }
    req.body = result.data;
    next();
  };
