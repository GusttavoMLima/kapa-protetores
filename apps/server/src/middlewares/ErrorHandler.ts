import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { BaseError } from '../errors/BaseError';
import multer from 'multer';

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
      res.status(400).json({ success: false, error: message });
      return;
    }
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        error: err.message,
        details: err.details,
      });
      return;
    }

    if (err instanceof BaseError && err.statusCode < 500) {
      res.status(err.statusCode).json({ success: false, error: err.message });
      return;
    }

    console.error('[ServerError]:', err);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
    });
  }
}
