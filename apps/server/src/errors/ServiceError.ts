import { BaseError } from './BaseError';

export class ServiceError extends BaseError {
  constructor(
    message = 'Service unavailable',
    statusCode = 500,
    cause?: unknown,
  ) {
    super({
      message,
      name: 'ServiceError',
      statusCode,
      cause,
    });
  }
}
