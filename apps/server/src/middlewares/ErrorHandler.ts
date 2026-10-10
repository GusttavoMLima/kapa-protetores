import { Request, Response, NextFunction } from 'express';
import { BaseError } from '../errors/BaseError';
import multer from 'multer';
import { InternalServerError, BadRequestError, NotFoundError } from '../errors';

export class ErrorHandler {
  public static handle(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'A foto deve ter no máximo 5 MB.'
          : 'Não foi possível processar a foto enviada.';

      return new BadRequestError(message).sendResponse(res);
    }

    if (err instanceof BaseError && err.statusCode < 500) {
      return err.sendResponse(res);
    }

    if (err instanceof NotFoundError) {
      return err.sendResponse(res);
    }

    console.error('[ServerError]:', err);
    return new InternalServerError().sendResponse(res);
  }
}
