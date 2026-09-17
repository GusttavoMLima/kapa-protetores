import { BaseError } from './BaseError';

export class ValidationError extends BaseError {
  constructor(message: string) {
    super({
      message: message || 'Validation error',
      name: 'ValidationError',
      statusCode: 400,
    });
  }
}