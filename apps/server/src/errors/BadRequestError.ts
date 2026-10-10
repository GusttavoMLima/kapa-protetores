import { BaseError } from './BaseError';

export class BadRequestError extends BaseError {
  constructor(message: string = 'Dados inválidos.', details?: unknown) {
    super({
      message,
      name: 'BadRequestError',
      statusCode: 400,
      details,
    });
  }
}
