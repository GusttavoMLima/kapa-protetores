import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { BaseError } from '../errors/BaseError';
import multer from 'multer';
import type { ApiErrorResponse } from '@kapa/shared';

export class ErrorHandler {
  public static handle(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): void {
    if (err instanceof multer.MulterError) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'A foto deve ter no máximo 5 MB.'
        : 'Não foi possível processar a foto enviada.';
      const response: ApiErrorResponse = { success: false, error: message };
      res.status(400).json(response);
      return;
    }
    if (err instanceof AppError) {
      const response: ApiErrorResponse = {
        success: false,
        error: err.message,
        details: err.details,
      };
      res.status(err.statusCode).json(response);
      return;
    }

    if (err instanceof BaseError && err.statusCode < 500) {
      const response: ApiErrorResponse = { success: false, error: err.message };
      res.status(err.statusCode).json(response);
      return;
    }

    console.error('[ServerError]:', err);
    const response: ApiErrorResponse = {
      success: false,
      error: 'Internal Server Error',
    };
    res.status(500).json(response);
  }
}
