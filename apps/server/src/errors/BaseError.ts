import { Response } from "express";

interface BaseErrorProps {
  name: string;
  message: string;
  cause?: unknown;
  statusCode?: number;
  details?: unknown;
}

export class BaseError extends Error {
  public statusCode: number;
  public override cause?: unknown;
  public details?: unknown;

  constructor({ message, name, cause, statusCode = 500, details }: BaseErrorProps) {
    super(message);

    this.name = name;
    this.statusCode = statusCode;
    this.cause = cause;
    this.details = details;

    Error.captureStackTrace?.(this, this.constructor);
  }

  public sendResponse(res: Response) {
    res.status(this.statusCode).json({
      success: false,
      data: null,
      message: this.message,
      error: this.name,
      ...(this.details !== undefined ? { details: this.details } : {}),
    });
  }
}
