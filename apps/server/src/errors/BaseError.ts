interface BaseErrorProps {
  name: string;
  message: string;
  cause?: unknown;
  statusCode?: number;
}

export class BaseError extends Error {
  public statusCode: number;
  public override cause?: unknown;

  constructor({ message, name, cause, statusCode = 500 }: BaseErrorProps) {
    super(message);

    this.name = name;
    this.statusCode = statusCode;
    this.cause = cause;

    Error.captureStackTrace?.(this, this.constructor);
  }
}
