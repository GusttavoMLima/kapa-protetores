import { BaseError } from './BaseError';

export class UnauthorizedError extends BaseError {
  constructor(message: string = 'Não autorizado') {
    super({
      message,
      name: 'UnauthorizedError',
      statusCode: 401,
    });
  }
}
