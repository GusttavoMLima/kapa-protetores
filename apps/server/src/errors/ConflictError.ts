import { BaseError } from './BaseError';

export class ConflictError extends BaseError {
  constructor(message: string = 'Conflito de dados') {
    super({
      message,
      name: 'ConflictError',
      statusCode: 409,
    });
  }
}
