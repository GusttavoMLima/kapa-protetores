import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export class ErrorHandler {
  public static handle(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): void {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        error: err.message,
        details: err.details,
      });
      return;
    }

    console.error('[ServerError]:', err);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
}
