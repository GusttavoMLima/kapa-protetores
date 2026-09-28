import { BaseError } from './BaseError';

export class AppError extends BaseError {
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 400,
    details?: unknown,
  ) {
    super({
      message,
      name: 'AppError',
      statusCode,
    });
    this.details = details;
  }

  public static badRequest(message: string, details?: unknown): AppError {
    return new AppError(message, 400, details);
  }

  public static notFound(message: string = 'Recurso não encontrado'): AppError {
    return new AppError(message, 404);
  }

  public static unauthorized(message: string = 'Não autorizado'): AppError {
    return new AppError(message, 401);
  }

  public static forbidden(message: string = 'Acesso negado'): AppError {
    return new AppError(message, 403);
  }

  public static conflict(message: string): AppError {
    return new AppError(message, 409);
  }

  public static internal(message: string = 'Erro interno do servidor'): AppError {
    return new AppError(message, 500);
  }
}
