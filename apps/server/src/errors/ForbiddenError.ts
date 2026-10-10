import { BaseError } from './BaseError';

export class ForbiddenError extends BaseError {
  constructor(message: string = 'Acesso negado') {
    super({
      message,
      statusCode: 403,
      name: 'ForbiddenError',
    });
  }
}
