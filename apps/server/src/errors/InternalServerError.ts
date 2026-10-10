import { BaseError } from './BaseError';

export class InternalServerError extends BaseError {
  constructor(message: string = 'Erro interno do servidor', cause?: unknown) {
    super({
      message,
      name: 'InternalServerError',
      statusCode: 500,
      cause,
    });
  }
}
