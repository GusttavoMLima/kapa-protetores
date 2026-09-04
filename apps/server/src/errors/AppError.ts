export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public static badRequest(message: string, details?: unknown): AppError {
    return new AppError(message, 400, details);
  }

  public static notFound(message: string = 'Recurso não encontrado'): AppError {
    return new AppError(message, 404);
  }

  public static internal(message: string = 'Erro interno do servidor'): AppError {
    return new AppError(message, 500);
  }
}
