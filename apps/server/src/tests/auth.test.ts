import { describe, it } from 'node:test';
import assert from 'node:assert';
import { googleAuthSchema } from '../schemas/auth.schema';
import { Jwt } from '../utils/Jwt';
import { authTokenHandler } from '../middlewares/authTokenHandler';
import { Request, Response } from 'express';
import { UserJwt } from '@kapa/shared';

describe('Google Auth Schema Validation', () => {
  it('should reject missing idToken', () => {
    const result = googleAuthSchema.safeParse({});
    assert.strictEqual(result.success, false);
  });

  it('should reject empty idToken string', () => {
    const result = googleAuthSchema.safeParse({ idToken: '' });
    assert.strictEqual(result.success, false);
  });

  it('should accept valid idToken', () => {
    const result = googleAuthSchema.safeParse({ idToken: 'valid-google-id-token' });
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.idToken, 'valid-google-id-token');
    }
  });
});

describe('Jwt Utility', () => {
  it('should generate and verify valid token', () => {
    const payload: UserJwt = {
      sub: '123e4567-e89b-12d3-a456-426614174000',
      email: 'user@example.com',
      username: 'Test User',
      role: 'adopter',
      rules: ['adopter:read'],
    };

    const token = Jwt.generateToken(payload);
    assert.ok(typeof token === 'string' && token.length > 0);

    const [decoded, isValid] = Jwt.verify(token);
    assert.strictEqual(isValid, true);
    assert.ok(decoded && typeof decoded === 'object');
    assert.strictEqual((decoded as UserJwt).sub, payload.sub);
    assert.strictEqual((decoded as UserJwt).email, payload.email);
    assert.strictEqual((decoded as UserJwt).role, payload.role);
  });

  it('should reject invalid or tampered token', () => {
    const [, isValid] = Jwt.verify('invalid.token.here');
    assert.strictEqual(isValid, false);
  });

  it('should reject empty token', () => {
    const [, isValid] = Jwt.verify('');
    assert.strictEqual(isValid, false);
  });
});

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
    assert.strictEqual(statusCode, 401);
    assert.strictEqual(nextCalled, false);
    assert.deepStrictEqual(responseBody, {
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
    assert.strictEqual(statusCode, 403);
    assert.strictEqual(nextCalled, false);
    assert.deepStrictEqual(responseBody, {
      error: 'Invalid or expired token',
    });
  });

  it('should call next and attach user when token is valid', () => {
    const userJwt: UserJwt = {
      sub: 'user-uuid-1',
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
    assert.strictEqual(nextCalled, true);
    assert.ok(req.user);
    assert.strictEqual(req.user.sub, userJwt.sub);
    assert.strictEqual(req.user.email, userJwt.email);
  });
});

describe('AuthController', () => {
  it('should forward badRequest error when idToken is missing', async () => {
    const mockUserService = {} as unknown as import('../services/UserService').UserService;
    const { AuthController } = await import('../controllers/AuthController');
    const controller = new AuthController(mockUserService);

    const req = { body: {} } as unknown as Request;
    const res = {} as unknown as Response;
    let forwardedError: unknown;
    const next = (err?: unknown) => { forwardedError = err; };

    await controller.googleSignIn(req, res, next);
    assert.ok(forwardedError instanceof Error);
  });

  it('should authenticate and return 200 with token and user', async () => {
    const { User } = await import('../models/User');
    const mockUser = new User();
    mockUser.setId('123e4567-e89b-12d3-a456-426614174000');
    mockUser.setUsername('Google User');
    mockUser.setEmail('google@example.com');
    mockUser.setRole('adopter');
    mockUser.setCreatedAt(new Date().toISOString());

    const mockUserService = {
      authenticateWithGoogle: async () => mockUser,
    } as unknown as import('../services/UserService').UserService;

    const { AuthController } = await import('../controllers/AuthController');
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
    assert.strictEqual(statusCode, 200);
    assert.ok(responseData && typeof responseData === 'object');
    const typedRes = responseData as { success: boolean; data: { token: string; user: { email: string } } };
    assert.strictEqual(typedRes.success, true);
    assert.ok(typedRes.data.token);
    assert.strictEqual(typedRes.data.user.email, 'google@example.com');
  });
});

describe('UserService Google Authentication', () => {
  it('should reject invalid or malformed token with AppError.unauthorized', async () => {
    const { UserService } = await import('../services/UserService');
    const mockRepo = {} as unknown as import('../repositories/UserRepository').UserRepository;
    const service = new UserService(mockRepo);

    await assert.rejects(
      async () => {
        await service.authenticateWithGoogle('malformed.jwt.token');
      },
      (err: unknown) => {
        const appErr = err as { statusCode?: number; message?: string };
        return appErr.statusCode === 401;
      }
    );
  });

  it('should reject invalid non-jwt token with AppError.unauthorized', async () => {
    const { UserService } = await import('../services/UserService');
    const mockRepo = {} as unknown as import('../repositories/UserRepository').UserRepository;
    const service = new UserService(mockRepo);

    await assert.rejects(
      async () => {
        await service.authenticateWithGoogle('invalid_opaque_token');
      },
      (err: unknown) => {
        const appErr = err as { statusCode?: number; message?: string };
        return appErr.statusCode === 401;
      }
    );
  });
});

describe('Url Value Object', () => {
  it('should preserve casing in URL paths, tokens, and query parameters', async () => {
    const { Url } = await import('../domains/Url');
    const googleAvatarUrl =
      'https://lh3.googleusercontent.com/a/ACg8ocKj5bUBjtQMPWLDqq3cbn6OOwbxsQODpm_8JArvUfunrRd5xf492Q=s96-c';
    const parsed = Url.create(googleAvatarUrl);

    assert.strictEqual(parsed.toString(), googleAvatarUrl);
    assert.strictEqual(parsed.getValue(), googleAvatarUrl);
  });
});

describe('User Schema Validation', () => {
  it('should validate signInSchema correctly', async () => {
    const { signInSchema } = await import('../schemas/user.schema');

    // Missing fields
    assert.strictEqual(signInSchema.safeParse({}).success, false);

    // Invalid email
    assert.strictEqual(
      signInSchema.safeParse({ email: 'not-an-email', password: '123' }).success,
      false,
    );

    // Empty password
    assert.strictEqual(
      signInSchema.safeParse({ email: 'test@example.com', password: '' }).success,
      false,
    );

    // Valid with lowercased email
    const valid = signInSchema.safeParse({
      email: '  User@Example.COM  ',
      password: 'mypassword',
    });
    assert.strictEqual(valid.success, true);
    if (valid.success) {
      assert.strictEqual(valid.data.email, 'user@example.com');
      assert.strictEqual(valid.data.password, 'mypassword');
    }
  });

  it('should validate registerSchema correctly', async () => {
    const { registerSchema } = await import('../schemas/user.schema');

    // Too short username
    assert.strictEqual(
      registerSchema.safeParse({
        username: 'ab',
        email: 'test@example.com',
        password: 'password123',
      }).success,
      false,
    );

    // Too short password
    assert.strictEqual(
      registerSchema.safeParse({
        username: 'validuser',
        email: 'test@example.com',
        password: '123',
      }).success,
      false,
    );

    // Invalid avatar URL
    assert.strictEqual(
      registerSchema.safeParse({
        username: 'validuser',
        email: 'test@example.com',
        password: 'password123',
        avatar: 'not-a-valid-url',
      }).success,
      false,
    );

    // Empty string avatar should transform to null
    const emptyAvatar = registerSchema.safeParse({
      username: 'validuser',
      email: 'test@example.com',
      password: 'password123',
      avatar: '',
    });
    assert.strictEqual(emptyAvatar.success, true);
    if (emptyAvatar.success) {
      assert.strictEqual(emptyAvatar.data.avatar, null);
    }

    // Invalid latitude range
    assert.strictEqual(
      registerSchema.safeParse({
        username: 'validuser',
        email: 'test@example.com',
        password: 'password123',
        latitude: 95,
      }).success,
      false,
    );

    // Valid complete registration
    const valid = registerSchema.safeParse({
      username: '  validuser  ',
      email: '  USER@example.com  ',
      password: 'securepassword123',
      avatar: 'https://example.com/avatar.jpg',
      latitude: -23.55052,
      longitude: -46.633308,
    });
    assert.strictEqual(valid.success, true);
    if (valid.success) {
      assert.strictEqual(valid.data.username, 'validuser');
      assert.strictEqual(valid.data.email, 'user@example.com');
      assert.strictEqual(valid.data.avatar, 'https://example.com/avatar.jpg');
      assert.strictEqual(valid.data.latitude, -23.55052);
      assert.strictEqual(valid.data.longitude, -46.633308);
    }
  });
});

describe('UserRepository Mapping', () => {
  it('should map null latitude and longitude to null instead of 0', async () => {
    const { UserRepository } = await import('../repositories/UserRepository');
    const mockPrisma = {} as unknown as import('@prisma/client').PrismaClient;
    const repo = new UserRepository(mockPrisma);

    // Access mapToDomain via mock record
    const record = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hash',
      avatar: null,
      role: 'adopter' as const,
      rules: ['adopter:read'],
      latitude: null,
      longitude: null,
      created_at: new Date('2026-01-01T00:00:00Z'),
    };

    // @ts-expect-error accessing private method for unit verification
    const user = repo.mapToDomain(record);
    assert.strictEqual(user.getLatitude(), null);
    assert.strictEqual(user.getLongitude(), null);

    const dto = user.toDTO();
    assert.strictEqual(dto.latitude, null);
    assert.strictEqual(dto.longitude, null);
  });
});

describe('UserController', () => {
  it('should reject signin with incorrect password', async () => {
    const { Encrypt } = await import('../utils/Encypt');
    const { User } = await import('../models/User');
    const { UserController } = await import('../controllers/UserController');

    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setUsername('Test User');
    user.setEmail('user@example.com');
    user.setPassword(Encrypt.saltHash('correct-password').toString('hex'));
    user.setRole('adopter');
    user.setCreatedAt(new Date().toISOString());

    const mockUserService = {
      getByEmail: async () => user,
    } as unknown as import('../services/UserService').UserService;

    const controller = new UserController(mockUserService);

    const req = {
      body: { email: 'user@example.com', password: 'wrong-password' },
    } as unknown as Request;
    const res = {} as unknown as Response;

    let forwardedError: unknown;
    const next = (err?: unknown) => {
      forwardedError = err;
    };

    await controller.signIn(req, res, next);
    assert.ok(forwardedError);
    const appErr = forwardedError as { statusCode?: number; message?: string };
    assert.strictEqual(appErr.statusCode, 401);
  });

  it('should sign in successfully with correct credentials', async () => {
    const { Encrypt } = await import('../utils/Encypt');
    const { User } = await import('../models/User');
    const { UserController } = await import('../controllers/UserController');

    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setUsername('Test User');
    user.setEmail('user@example.com');
    user.setPassword(Encrypt.saltHash('correct-password').toString('hex'));
    user.setRole('adopter');
    user.setCreatedAt(new Date().toISOString());

    const mockUserService = {
      getByEmail: async () => user,
    } as unknown as import('../services/UserService').UserService;

    const controller = new UserController(mockUserService);

    const req = {
      body: { email: 'user@example.com', password: 'correct-password' },
    } as unknown as Request;

    let statusCode: number | undefined;
    let responseBody: unknown;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: unknown) {
        responseBody = data;
        return this;
      },
    } as unknown as Response;

    const next = () => {};

    await controller.signIn(req, res, next);
    assert.strictEqual(statusCode, 200);
    const typedBody = responseBody as { success: boolean; data: { token: string; user: { email: string } } };
    assert.strictEqual(typedBody.success, true);
    assert.ok(typedBody.data.token);
    assert.strictEqual(typedBody.data.user.email, 'user@example.com');
  });

  it('should reject registration if email already exists', async () => {
    const { User } = await import('../models/User');
    const { UserController } = await import('../controllers/UserController');

    const existingUser = new User();
    existingUser.setId('123e4567-e89b-12d3-a456-426614174000');
    existingUser.setUsername('Existing User');
    existingUser.setEmail('exists@example.com');
    existingUser.setRole('adopter');
    existingUser.setCreatedAt(new Date().toISOString());

    const mockUserService = {
      getByEmail: async () => existingUser,
    } as unknown as import('../services/UserService').UserService;

    const controller = new UserController(mockUserService);

    const req = {
      body: {
        username: 'newuser',
        email: 'exists@example.com',
        password: 'password123',
      },
    } as unknown as Request;
    const res = {} as unknown as Response;

    let forwardedError: unknown;
    const next = (err?: unknown) => {
      forwardedError = err;
    };

    await controller.register(req, res, next);
    assert.ok(forwardedError);
    const appErr = forwardedError as { statusCode?: number };
    assert.strictEqual(appErr.statusCode, 409);
  });

  it('should reject userInfo request when user is not authenticated', async () => {
    const { UserController } = await import('../controllers/UserController');
    const mockUserService = {} as unknown as import('../services/UserService').UserService;
    const controller = new UserController(mockUserService);

    const req = {} as unknown as Request;
    const res = {} as unknown as Response;

    let forwardedError: unknown;
    const next = (err?: unknown) => {
      forwardedError = err;
    };

    await controller.userInfo(req, res, next);
    assert.ok(forwardedError);
    const appErr = forwardedError as { statusCode?: number };
    assert.strictEqual(appErr.statusCode, 401);
  });

  it('should return 200 with sanitized user info and counts without password hash', async () => {
    const { UserController } = await import('../controllers/UserController');
    const mockUserInfo = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      username: 'Test User',
      email: 'user@example.com',
      role: 'adopter' as const,
      rules: ['adopter:read'],
      avatar: null,
      latitude: null,
      longitude: null,
      createdAt: new Date().toISOString(),
      counts: {
        adoptions: 2,
        events: 5,
        favorites: 8,
      },
    };

    const mockUserService = {
      getByIdWithRelationsCount: async () => mockUserInfo,
    } as unknown as import('../services/UserService').UserService;

    const controller = new UserController(mockUserService);

    const req = {
      user: {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        role: 'adopter',
        rules: ['adopter:read'],
        username: 'Test User',
      },
    } as unknown as Request;

    let statusCode: number | undefined;
    let responseBody: unknown;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: unknown) {
        responseBody = data;
        return this;
      },
    } as unknown as Response;

    const next = () => {};

    await controller.userInfo(req, res, next);
    assert.strictEqual(statusCode, 200);
    const typedBody = responseBody as {
      success: boolean;
      data: typeof mockUserInfo & { password?: unknown };
    };
    assert.strictEqual(typedBody.success, true);
    assert.strictEqual(typedBody.data.id, '123e4567-e89b-12d3-a456-426614174000');
    assert.strictEqual(typedBody.data.counts.adoptions, 2);
    assert.strictEqual(typedBody.data.password, undefined);
  });

  it('should return all users mapped to DTO via getAll', async () => {
    const { User } = await import('../models/User');
    const { UserController } = await import('../controllers/UserController');

    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setUsername('Test User');
    user.setEmail('user@example.com');
    user.setRole('adopter');
    user.setCreatedAt(new Date().toISOString());

    const mockUserService = {
      getAll: async () => [user],
    } as unknown as import('../services/UserService').UserService;

    const controller = new UserController(mockUserService);

    const req = {} as unknown as Request;
    let statusCode: number | undefined;
    let responseBody: unknown;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: unknown) {
        responseBody = data;
        return this;
      },
    } as unknown as Response;

    const next = () => {};

    await controller.getAll(req, res, next);
    assert.strictEqual(statusCode, 200);
    const typedBody = responseBody as {
      success: boolean;
      data: Array<{ id: string; email: string }>;
    };
    assert.strictEqual(typedBody.success, true);
    assert.strictEqual(typedBody.data.length, 1);
    assert.strictEqual(typedBody.data[0].email, 'user@example.com');
  });

  it('should return user by id via getById', async () => {
    const { User } = await import('../models/User');
    const { UserController } = await import('../controllers/UserController');

    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setUsername('Test User');
    user.setEmail('user@example.com');
    user.setRole('adopter');
    user.setCreatedAt(new Date().toISOString());

    const mockUserService = {
      getById: async () => user,
    } as unknown as import('../services/UserService').UserService;

    const controller = new UserController(mockUserService);

    const req = {
      params: { id: '123e4567-e89b-12d3-a456-426614174000' },
    } as unknown as Request;

    let statusCode: number | undefined;
    let responseBody: unknown;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: unknown) {
        responseBody = data;
        return this;
      },
    } as unknown as Response;

    const next = () => {};

    await controller.getById(req, res, next);
    assert.strictEqual(statusCode, 200);
    const typedBody = responseBody as {
      success: boolean;
      data: { id: string; email: string };
    };
    assert.strictEqual(typedBody.success, true);
    assert.strictEqual(typedBody.data.email, 'user@example.com');
  });

  it('should reject updatePassword when user is not authenticated', async () => {
    const { UserController } = await import('../controllers/UserController');
    const mockUserService = {} as unknown as import('../services/UserService').UserService;
    const controller = new UserController(mockUserService);

    const req = { body: {} } as unknown as Request;
    const res = {} as unknown as Response;

    let forwardedError: unknown;
    const next = (err?: unknown) => {
      forwardedError = err;
    };

    await controller.updatePassword(req, res, next);
    assert.ok(forwardedError);
    const appErr = forwardedError as { statusCode?: number };
    assert.strictEqual(appErr.statusCode, 401);
  });

  it('should reject updatePassword with invalid body schema', async () => {
    const { UserController } = await import('../controllers/UserController');
    const mockUserService = {} as unknown as import('../services/UserService').UserService;
    const controller = new UserController(mockUserService);

    const req = {
      user: { sub: '123e4567-e89b-12d3-a456-426614174000' },
      body: { currentPassword: '', newPassword: '123' },
    } as unknown as Request;
    const res = {} as unknown as Response;

    let forwardedError: unknown;
    const next = (err?: unknown) => {
      forwardedError = err;
    };

    await controller.updatePassword(req, res, next);
    assert.ok(forwardedError);
    const appErr = forwardedError as { statusCode?: number };
    assert.strictEqual(appErr.statusCode, 400);
  });

  it('should successfully update password and return 200', async () => {
    const { UserController } = await import('../controllers/UserController');
    let calledWith: unknown[] = [];
    const mockUserService = {
      updatePassword: async (id: string, current: string, newPass: string) => {
        calledWith = [id, current, newPass];
      },
    } as unknown as import('../services/UserService').UserService;
    const controller = new UserController(mockUserService);

    const req = {
      user: { sub: '123e4567-e89b-12d3-a456-426614174000' },
      body: { currentPassword: 'oldPassword123', newPassword: 'newPassword123' },
    } as unknown as Request;

    let statusCode: number | undefined;
    let responseBody: unknown;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: unknown) {
        responseBody = data;
        return this;
      },
    } as unknown as Response;

    const next = () => {};

    await controller.updatePassword(req, res, next);
    assert.strictEqual(statusCode, 200);
    const typedBody = responseBody as { success: boolean; message: string };
    assert.strictEqual(typedBody.success, true);
    assert.deepStrictEqual(calledWith, [
      '123e4567-e89b-12d3-a456-426614174000',
      'oldPassword123',
      'newPassword123',
    ]);
  });
});

describe('UserService updatePassword', () => {
  it('should throw 400 when user has no password (e.g. Google-created account)', async () => {
    const { User } = await import('../models/User');
    const { UserService } = await import('../services/UserService');

    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setEmail('google@example.com');
    // No password set

    const mockRepo = {
      findById: async () => user,
    } as unknown as import('../repositories/UserRepository').UserRepository;

    const service = new UserService(mockRepo);

    await assert.rejects(
      async () => {
        await service.updatePassword(
          '123e4567-e89b-12d3-a456-426614174000',
          'anyPass',
          'newPass123',
        );
      },
      (err: { statusCode?: number }) => {
        assert.strictEqual(err.statusCode, 400);
        return true;
      },
    );
  });

  it('should throw 401 when current password does not match', async () => {
    const { User } = await import('../models/User');
    const { Encrypt } = await import('../utils/Encypt');
    const { UserService } = await import('../services/UserService');

    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setEmail('user@example.com');
    user.setPassword(Encrypt.saltHash('correctCurrentPassword').toString('hex'));

    const mockRepo = {
      findById: async () => user,
    } as unknown as import('../repositories/UserRepository').UserRepository;

    const service = new UserService(mockRepo);

    await assert.rejects(
      async () => {
        await service.updatePassword(
          '123e4567-e89b-12d3-a456-426614174000',
          'wrongCurrentPassword',
          'newPass123',
        );
      },
      (err: { statusCode?: number }) => {
        assert.strictEqual(err.statusCode, 401);
        return true;
      },
    );
  });

  it('should throw 400 when new password is the same as current password', async () => {
    const { User } = await import('../models/User');
    const { Encrypt } = await import('../utils/Encypt');
    const { UserService } = await import('../services/UserService');

    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setEmail('user@example.com');
    user.setPassword(Encrypt.saltHash('samePassword123').toString('hex'));

    const mockRepo = {
      findById: async () => user,
    } as unknown as import('../repositories/UserRepository').UserRepository;

    const service = new UserService(mockRepo);

    await assert.rejects(
      async () => {
        await service.updatePassword(
          '123e4567-e89b-12d3-a456-426614174000',
          'samePassword123',
          'samePassword123',
        );
      },
      (err: { statusCode?: number }) => {
        assert.strictEqual(err.statusCode, 400);
        return true;
      },
    );
  });

  it('should successfully update password when inputs are valid', async () => {
    const { User } = await import('../models/User');
    const { Encrypt } = await import('../utils/Encypt');
    const { UserService } = await import('../services/UserService');

    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setEmail('user@example.com');
    user.setPassword(Encrypt.saltHash('oldPassword123').toString('hex'));

    let savedHash: string | undefined;
    const mockRepo = {
      findById: async () => user,
      updatePassword: async (_id: unknown, hash: string) => {
        savedHash = hash;
        user.setPassword(hash);
        return user;
      },
    } as unknown as import('../repositories/UserRepository').UserRepository;

    const service = new UserService(mockRepo);

    await service.updatePassword(
      '123e4567-e89b-12d3-a456-426614174000',
      'oldPassword123',
      'brandNewPassword123',
    );

    assert.ok(savedHash);
    assert.strictEqual(
      Encrypt.verifySaltHash('brandNewPassword123', savedHash),
      true,
    );
  });
});

describe('UserController remaining methods', () => {
  it('should successfully update profile and return 200', async () => {
    const { User } = await import('../models/User');
    const { UserController } = await import('../controllers/UserController');

    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setUsername('Updated Name');
    user.setEmail('user@example.com');
    user.setRole('adopter');
    user.setCreatedAt(new Date().toISOString());

    const mockUserService = {
      updateProfile: async () => user,
    } as unknown as import('../services/UserService').UserService;

    const controller = new UserController(mockUserService);

    const req = {
      user: { sub: '123e4567-e89b-12d3-a456-426614174000' },
      body: { username: 'Updated Name' },
    } as unknown as Request;

    let statusCode: number | undefined;
    let responseBody: unknown;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: unknown) {
        responseBody = data;
        return this;
      },
    } as unknown as Response;

    const next = () => {};

    await controller.updateProfile(req, res, next);
    assert.strictEqual(statusCode, 200);
    const typedBody = responseBody as { success: boolean; data: { username: string } };
    assert.strictEqual(typedBody.success, true);
    assert.strictEqual(typedBody.data.username, 'Updated Name');
  });

  it('should successfully delete own account via deleteMe and return 200', async () => {
    const { UserController } = await import('../controllers/UserController');

    let deletedId: string | undefined;
    const mockUserService = {
      deleteById: async (id: string) => {
        deletedId = id;
      },
    } as unknown as import('../services/UserService').UserService;

    const controller = new UserController(mockUserService);

    const req = {
      user: { sub: '123e4567-e89b-12d3-a456-426614174000' },
    } as unknown as Request;

    let statusCode: number | undefined;
    let responseBody: unknown;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: unknown) {
        responseBody = data;
        return this;
      },
    } as unknown as Response;

    const next = () => {};

    await controller.deleteMe(req, res, next);
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(deletedId, '123e4567-e89b-12d3-a456-426614174000');
    const typedBody = responseBody as { success: boolean };
    assert.strictEqual(typedBody.success, true);
  });

  it('should successfully update user role via updateRole and return 200', async () => {
    const { User } = await import('../models/User');
    const { UserController } = await import('../controllers/UserController');

    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setUsername('Role User');
    user.setEmail('role@example.com');
    user.setRole('volunteer');
    user.setCreatedAt(new Date().toISOString());

    const mockUserService = {
      updateRole: async () => user,
    } as unknown as import('../services/UserService').UserService;

    const controller = new UserController(mockUserService);

    const req = {
      params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      body: { role: 'volunteer' },
    } as unknown as Request;

    let statusCode: number | undefined;
    let responseBody: unknown;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: unknown) {
        responseBody = data;
        return this;
      },
    } as unknown as Response;

    const next = () => {};

    await controller.updateRole(req, res, next);
    assert.strictEqual(statusCode, 200);
    const typedBody = responseBody as { success: boolean; data: { role: string } };
    assert.strictEqual(typedBody.success, true);
    assert.strictEqual(typedBody.data.role, 'volunteer');
  });

  it('should successfully delete user by id and return 200', async () => {
    const { UserController } = await import('../controllers/UserController');

    let deletedId: string | undefined;
    const mockUserService = {
      deleteById: async (id: string) => {
        deletedId = id;
      },
    } as unknown as import('../services/UserService').UserService;

    const controller = new UserController(mockUserService);

    const req = {
      params: { id: '123e4567-e89b-12d3-a456-426614174000' },
    } as unknown as Request;

    let statusCode: number | undefined;
    let responseBody: unknown;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: unknown) {
        responseBody = data;
        return this;
      },
    } as unknown as Response;

    const next = () => {};

    await controller.deleteById(req, res, next);
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(deletedId, '123e4567-e89b-12d3-a456-426614174000');
    const typedBody = responseBody as { success: boolean };
    assert.strictEqual(typedBody.success, true);
  });
});

describe('UserRouter', () => {
  it('should register all user routes correctly', async () => {
    const { UserRouter } = await import('../routes/UserRouter');
    const mockController = {
      register: () => {},
      signIn: () => {},
      userInfo: () => {},
      getAll: () => {},
      getById: () => {},
      countAll: () => {},
      updatePassword: () => {},
      updateProfile: () => {},
      deleteMe: () => {},
      updateRole: () => {},
      deleteById: () => {},
    } as unknown as import('../controllers/UserController').UserController;

    const userRouter = new UserRouter(mockController);
    const routes = userRouter.router.stack.map((layer) => ({
      path: layer.route?.path,
      methods: (layer.route as { methods?: Record<string, boolean> } | undefined)
        ?.methods,
    }));

    assert.ok(routes.some((r) => r.path === '/count'));
    assert.ok(routes.some((r) => r.path === '/all'));
    assert.ok(routes.some((r) => r.path === '/create'));
    assert.ok(routes.some((r) => r.path === '/signin'));
    assert.ok(routes.some((r) => r.path === '/me' && r.methods?.get));
    assert.ok(routes.some((r) => r.path === '/me' && r.methods?.patch));
    assert.ok(routes.some((r) => r.path === '/me' && r.methods?.delete));
    assert.ok(routes.some((r) => r.path === '/me/password' && r.methods?.patch));
    assert.ok(routes.some((r) => r.path === '/:id' && r.methods?.get));
    assert.ok(routes.some((r) => r.path === '/:id/role' && r.methods?.patch));
    assert.ok(routes.some((r) => r.path === '/:id' && r.methods?.delete));
  });
});

