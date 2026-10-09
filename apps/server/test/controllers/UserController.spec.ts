import type { Request, Response } from 'express';
import { User } from '../../src/models/User';
import { UserService } from '../../src/services/UserService';
import { UserController } from '../../src/controllers/UserController';
import { Encrypt } from '../../src/utils/Encypt';
import type { UserRole } from '@kapa/shared';

describe('UserController', () => {
  it('countAll should return 200 with total user count', async () => {
    const mockUserService = {
      countAll: async () => 15,
    } as unknown as UserService;

    const controller = new UserController(mockUserService);
    const req = {} as Request;

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

    await controller.countAll(req, res, () => {});
    expect(statusCode).toBe(200);
    const body = responseBody as { success: boolean; data: number };
    expect(body.success).toBe(true);
    expect(body.data).toBe(15);
  });

  it('getAll should filter by role when query param is present', async () => {
    const volunteer = new User();
    volunteer.setId('123e4567-e89b-12d3-a456-426614174000');
    volunteer.setUsername('Volunteer1');
    volunteer.setEmail('vol@example.com');
    volunteer.setRole('volunteer');
    volunteer.setCreatedAt(new Date().toISOString());

    let queriedRole: UserRole | undefined;
    const mockUserService = {
      getAllByRole: async (role: UserRole) => {
        queriedRole = role;
        return [volunteer];
      },
      getAll: async () => [],
    } as unknown as UserService;

    const controller = new UserController(mockUserService);
    const req = { query: { role: 'volunteer' } } as unknown as Request;

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

    await controller.getAll(req, res, () => {});
    expect(statusCode).toBe(200);
    expect(queriedRole).toBe('volunteer');
    const body = responseBody as { data: Array<{ role: string }> };
    expect(body.data[0].role).toBe('volunteer');
  });

  it('updateProfile should reject unauthenticated request', async () => {
    const controller = new UserController({} as UserService);
    const req = {} as Request;
    let forwardedError: unknown;

    await controller.updateProfile(req, {} as Response, (err) => {
      forwardedError = err;
    });

    expect(forwardedError).toBeDefined();
    expect((forwardedError as { statusCode: number }).statusCode).toBe(401);
  });

  it('updateProfile should reject invalid payload', async () => {
    const controller = new UserController({} as UserService);
    const req = {
      user: { sub: '123e4567-e89b-12d3-a456-426614174000' },
      body: { username: 'x' }, // less than 3 chars
    } as unknown as Request;

    let forwardedError: unknown;
    await controller.updateProfile(req, {} as Response, (err) => {
      forwardedError = err;
    });

    expect(forwardedError).toBeDefined();
    expect((forwardedError as { statusCode: number }).statusCode).toBe(400);
  });

  it('deleteMe should reject unauthenticated request', async () => {
    const controller = new UserController({} as UserService);
    const req = {} as Request;
    let forwardedError: unknown;

    await controller.deleteMe(req, {} as Response, (err) => {
      forwardedError = err;
    });

    expect(forwardedError).toBeDefined();
    expect((forwardedError as { statusCode: number }).statusCode).toBe(401);
  });

  it('updateRole should reject invalid role payload', async () => {
    const controller = new UserController({} as UserService);
    const req = {
      params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      body: { role: 'hacker' },
    } as unknown as Request;

    let forwardedError: unknown;
    await controller.updateRole(req, {} as Response, (err) => {
      forwardedError = err;
    });

    expect(forwardedError).toBeDefined();
    expect((forwardedError as { statusCode: number }).statusCode).toBe(400);
  });

  it('getProfile should reject unauthenticated request with 401', async () => {
    const controller = new UserController({} as UserService);
    const req = {} as Request;
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

    await controller.getProfile(req, res, () => {});
    expect(statusCode).toBe(401);
    expect((responseBody as { success: boolean }).success).toBe(false);
  });

  it('getProfile should return 200 with user profile relations data', async () => {
    const mockRelationsData = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      latitude: -23.5505,
      longitude: -46.6333,
      counts: { adoptions: 1, events: 0, favorites: 2 },
      favorites: [],
      events: [],
    };
    const mockUserService = {
      getByIdWithRelationsData: async () => mockRelationsData,
    } as unknown as UserService;

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

    await controller.getProfile(req, res, () => {});
    expect(statusCode).toBe(200);
    const body = responseBody as { success: boolean; data: typeof mockRelationsData };
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('getProfile should forward 404 when user is not found', async () => {
    const mockUserService = {
      getByIdWithRelationsData: async () => {
        throw new Error('Not found');
      },
    } as unknown as UserService;

    const controller = new UserController(mockUserService);
    const req = {
      user: { sub: '123e4567-e89b-12d3-a456-426614174000' },
    } as unknown as Request;

    let forwardedError: unknown;
    await controller.getProfile(req, {} as Response, (err) => {
      forwardedError = err;
    });

    expect(forwardedError).toBeDefined();
    expect((forwardedError as { statusCode: number }).statusCode).toBe(404);
  });

  it('should reject signin with incorrect password', async () => {
    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setUsername('Test User');
    user.setEmail('user@example.com');
    user.setPassword(Encrypt.saltHash('correct-password').toString('hex'));
    user.setRole('adopter');
    user.setCreatedAt(new Date().toISOString());

    const mockUserService = {
      getByEmail: async () => user,
    } as unknown as UserService;

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
    expect(forwardedError).toBeDefined();
    const appErr = forwardedError as { statusCode?: number; message?: string };
    expect(appErr.statusCode).toBe(401);
  });

  it('should sign in successfully with correct credentials', async () => {
    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setUsername('Test User');
    user.setEmail('user@example.com');
    user.setPassword(Encrypt.saltHash('correct-password').toString('hex'));
    user.setRole('adopter');
    user.setCreatedAt(new Date().toISOString());

    const mockUserService = {
      getByEmail: async () => user,
    } as unknown as UserService;

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
    expect(statusCode).toBe(200);
    const typedBody = responseBody as { success: boolean; data: { token: string; user: { email: string } } };
    expect(typedBody.success).toBe(true);
    expect(typedBody.data.token).toBeDefined();
    expect(typedBody.data.user.email).toBe('user@example.com');
  });

  it('should reject registration if email already exists', async () => {
    const existingUser = new User();
    existingUser.setId('123e4567-e89b-12d3-a456-426614174000');
    existingUser.setUsername('Existing User');
    existingUser.setEmail('exists@example.com');
    existingUser.setRole('adopter');
    existingUser.setCreatedAt(new Date().toISOString());

    const mockUserService = {
      getByEmail: async () => existingUser,
    } as unknown as UserService;

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
    expect(forwardedError).toBeDefined();
    const appErr = forwardedError as { statusCode?: number };
    expect(appErr.statusCode).toBe(409);
  });

  it('should reject userInfo request when user is not authenticated', async () => {
    const mockUserService = {} as unknown as UserService;
    const controller = new UserController(mockUserService);

    const req = {} as unknown as Request;
    const res = {} as unknown as Response;

    let forwardedError: unknown;
    const next = (err?: unknown) => {
      forwardedError = err;
    };

    await controller.userInfo(req, res, next);
    expect(forwardedError).toBeDefined();
    const appErr = forwardedError as { statusCode?: number };
    expect(appErr.statusCode).toBe(401);
  });

  it('should return 200 with sanitized user info and counts without password hash', async () => {
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
    } as unknown as UserService;

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
    expect(statusCode).toBe(200);
    const typedBody = responseBody as {
      success: boolean;
      data: typeof mockUserInfo & { password?: unknown };
    };
    expect(typedBody.success).toBe(true);
    expect(typedBody.data.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(typedBody.data.counts.adoptions).toBe(2);
    expect(typedBody.data.password).toBeUndefined();
  });

  it('should return all users mapped to DTO via getAll', async () => {
    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setUsername('Test User');
    user.setEmail('user@example.com');
    user.setRole('adopter');
    user.setCreatedAt(new Date().toISOString());

    const mockUserService = {
      getAll: async () => [user],
    } as unknown as UserService;

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
    expect(statusCode).toBe(200);
    const typedBody = responseBody as {
      success: boolean;
      data: Array<{ id: string; email: string }>;
    };
    expect(typedBody.success).toBe(true);
    expect(typedBody.data.length).toBe(1);
    expect(typedBody.data[0].email).toBe('user@example.com');
  });

  it('should return user by id via getById', async () => {
    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setUsername('Test User');
    user.setEmail('user@example.com');
    user.setRole('adopter');
    user.setCreatedAt(new Date().toISOString());

    const mockUserService = {
      getById: async () => user,
    } as unknown as UserService;

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
    expect(statusCode).toBe(200);
    const typedBody = responseBody as {
      success: boolean;
      data: { id: string; email: string };
    };
    expect(typedBody.success).toBe(true);
    expect(typedBody.data.email).toBe('user@example.com');
  });

  it('should reject updatePassword when user is not authenticated', async () => {
    const mockUserService = {} as unknown as UserService;
    const controller = new UserController(mockUserService);

    const req = { body: {} } as unknown as Request;
    const res = {} as unknown as Response;

    let forwardedError: unknown;
    const next = (err?: unknown) => {
      forwardedError = err;
    };

    await controller.updatePassword(req, res, next);
    expect(forwardedError).toBeDefined();
    const appErr = forwardedError as { statusCode?: number };
    expect(appErr.statusCode).toBe(401);
  });

  it('should reject updatePassword with invalid body schema', async () => {
    const mockUserService = {} as unknown as UserService;
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
    expect(forwardedError).toBeDefined();
    const appErr = forwardedError as { statusCode?: number };
    expect(appErr.statusCode).toBe(400);
  });

  it('should successfully update password and return 200', async () => {
    let calledWith: unknown[] = [];
    const mockUserService = {
      updatePassword: async (id: string, current: string, newPass: string) => {
        calledWith = [id, current, newPass];
      },
    } as unknown as UserService;
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
    expect(statusCode).toBe(200);
    const typedBody = responseBody as { success: boolean; message: string };
    expect(typedBody.success).toBe(true);
    expect(calledWith).toEqual([
      '123e4567-e89b-12d3-a456-426614174000',
      'oldPassword123',
      'newPassword123',
    ]);
  });

  it('should successfully update profile and return 200', async () => {
    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setUsername('Updated Name');
    user.setEmail('user@example.com');
    user.setRole('adopter');
    user.setCreatedAt(new Date().toISOString());

    const mockUserService = {
      updateProfile: async () => user,
    } as unknown as UserService;

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
    expect(statusCode).toBe(200);
    const typedBody = responseBody as { success: boolean; data: { username: string } };
    expect(typedBody.success).toBe(true);
    expect(typedBody.data.username).toBe('Updated Name');
  });

  it('should successfully delete own account via deleteMe and return 200', async () => {
    let deletedId: string | undefined;
    const mockUserService = {
      deleteById: async (id: string) => {
        deletedId = id;
      },
    } as unknown as UserService;

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
    expect(statusCode).toBe(200);
    expect(deletedId).toBe('123e4567-e89b-12d3-a456-426614174000');
    const typedBody = responseBody as { success: boolean };
    expect(typedBody.success).toBe(true);
  });

  it('should successfully update user role via updateRole and return 200', async () => {
    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setUsername('Role User');
    user.setEmail('role@example.com');
    user.setRole('volunteer');
    user.setCreatedAt(new Date().toISOString());

    const mockUserService = {
      updateRole: async () => user,
    } as unknown as UserService;

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
    expect(statusCode).toBe(200);
    const typedBody = responseBody as { success: boolean; data: { role: string } };
    expect(typedBody.success).toBe(true);
    expect(typedBody.data.role).toBe('volunteer');
  });

  it('should successfully delete user by id and return 200', async () => {
    let deletedId: string | undefined;
    const mockUserService = {
      deleteById: async (id: string) => {
        deletedId = id;
      },
    } as unknown as UserService;

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
    expect(statusCode).toBe(200);
    expect(deletedId).toBe('123e4567-e89b-12d3-a456-426614174000');
    const typedBody = responseBody as { success: boolean };
    expect(typedBody.success).toBe(true);
  });
});
