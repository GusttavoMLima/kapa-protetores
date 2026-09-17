import { BaseError } from './BaseError';

export class DataTypeError extends BaseError {
  constructor(message: string) {
    super({
      message: message || '',
      name: 'DataTypeError',
      statusCode: 400,
    });
  }
}
