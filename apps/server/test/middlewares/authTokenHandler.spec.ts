import type { Request, Response } from 'express';
import { authTokenHandler } from '../../src/middlewares/authTokenHandler';
import { Jwt } from '../../src/utils/Jwt';
import type { UserJwt } from '@kapa/shared';

describe('authTokenHandler Middleware', () => {
  it('should return 401 when Authorization header is missing', () => {
    const req = { headers: {} } as unknown as Request;
    let statusCode: number | undefined;
    let responseBody: unknown;

    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(body: unknown) {
        responseBody = body;
        return this;
      },
    } as unknown as Response;

    let nextCalled = false;
    const next = () => { nextCalled = true; };

    authTokenHandler(req, res, next);
    expect(statusCode).toBe(401);
    expect(nextCalled).toBe(false);
    expect(responseBody).toEqual({
      error: 'Authentication token is required',
    });
  });

  it('should return 403 when token is invalid', () => {
    const req = {
      headers: { authorization: 'Bearer invalid-token' },
    } as unknown as Request;

    let statusCode: number | undefined;
    let responseBody: unknown;

    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(body: unknown) {
        responseBody = body;
        return this;
      },
    } as unknown as Response;

    let nextCalled = false;
    const next = () => { nextCalled = true; };

    authTokenHandler(req, res, next);
    expect(statusCode).toBe(403);
    expect(nextCalled).toBe(false);
    expect(responseBody).toEqual({
      error: 'Invalid or expired token',
    });
  });

  it('should call next and attach user when token is valid', () => {
    const userJwt: UserJwt = {
      sub: '123e4567-e89b-12d3-a456-426614174000',
      email: 'valid@example.com',
      username: 'Valid User',
      role: 'adopter',
      rules: ['adopter:read'],
    };

    const token = Jwt.generateToken(userJwt);
    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as unknown as Request;

    const res = {} as unknown as Response;
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    authTokenHandler(req, res, next);
    expect(nextCalled).toBe(true);
    expect(req.user).toBeDefined();
    expect(req.user!.sub).toBe(userJwt.sub);
    expect(req.user!.email).toBe(userJwt.email);
  });
});
