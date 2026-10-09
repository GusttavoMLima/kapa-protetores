import type { Request, Response } from 'express';
import { AuthController } from '../../src/controllers/AuthController';
import { UserService } from '../../src/services/UserService';
import { User } from '../../src/models/User';

describe('AuthController', () => {
  it('should forward badRequest error when idToken is missing', async () => {
    const mockUserService = {} as unknown as UserService;
    const controller = new AuthController(mockUserService);

    const req = { body: {} } as unknown as Request;
    const res = {} as unknown as Response;
    let forwardedError: unknown;
    const next = (err?: unknown) => {
      forwardedError = err;
    };

    await controller.googleSignIn(req, res, next);
    expect(forwardedError).toBeInstanceOf(Error);
  });

  it('should authenticate and return 200 with token and user', async () => {
    const mockUser = new User();
    mockUser.setId('123e4567-e89b-12d3-a456-426614174000');
    mockUser.setUsername('Google User');
    mockUser.setEmail('google@example.com');
    mockUser.setRole('adopter');
    mockUser.setCreatedAt(new Date().toISOString());

    const mockUserService = {
      authenticateWithGoogle: async () => mockUser,
    } as unknown as UserService;

    const controller = new AuthController(mockUserService);

    const req = { body: { idToken: 'valid-google-id-token' } } as unknown as Request;
    let statusCode: number | undefined;
    let responseData: unknown;

    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(body: unknown) {
        responseData = body;
        return this;
      },
    } as unknown as Response;

    const next = () => {};

    await controller.googleSignIn(req, res, next);
    expect(statusCode).toBe(200);
    expect(responseData).toBeDefined();
    const typedRes = responseData as { success: boolean; data: { token: string; user: { email: string } } };
    expect(typedRes.success).toBe(true);
    expect(typedRes.data.token).toBeDefined();
    expect(typedRes.data.user.email).toBe('google@example.com');
  });
});
