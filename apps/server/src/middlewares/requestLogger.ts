import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { Logger } from 'pino';
import { logger as defaultLogger } from '../config/logger';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
  }
}

const SAFE_REQUEST_ID_PATTERN = /^[a-zA-Z0-9._-]{1,128}$/;

export function resolveRequestId(
  headerValue: string | string[] | undefined,
): string {
  const candidate = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (candidate && SAFE_REQUEST_ID_PATTERN.test(candidate.trim())) {
    return candidate.trim();
  }
  return randomUUID();
}

export function createRequestLogger(log: Logger = defaultLogger) {
  return function requestLogger(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const requestId = resolveRequestId(req.headers['x-request-id']);
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    const startTime = process.hrtime.bigint();

    res.on('finish', () => {
      const durationMs =
        Number(process.hrtime.bigint() - startTime) / 1_000_000;
      const roundedDurationMs = Math.round(durationMs * 100) / 100;
      const statusCode = res.statusCode;
      const routePath = req.originalUrl || req.url;

      const logPayload = {
        requestId,
        method: req.method,
        path: routePath,
        statusCode,
        durationMs: roundedDurationMs,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: req.user?.sub,
      };

      const message = `${req.method} ${routePath} ${statusCode} - ${roundedDurationMs}ms`;

      if (statusCode >= 500) {
        log.error(logPayload, message);
      } else if (statusCode >= 400) {
        log.warn(logPayload, message);
      } else if (req.method === 'OPTIONS') {
        log.debug(logPayload, message);
      } else {
        log.info(logPayload, message);
      }
    });

    next();
  };
}

export const requestLogger = createRequestLogger();
