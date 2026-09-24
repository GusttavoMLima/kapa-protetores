import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { Request, Response } from 'express';
import { User } from '../models/User';
import {
  userIdParams,
  updateProfileSchema,
  updateRoleSchema,
  updateUserPasswordSchema,
} from '../schemas/user.schema';
import { UserService } from '../services/UserService';
import { UserController } from '../controllers/UserController';
import { UserRouter } from '../routes/UserRouter';
import { UserRole, UserWithRelationsCount } from '@kapa/shared';

describe('User Domain Entity', () => {
  it('should initialize and set properties correctly', () => {
    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setUsername('AdopterJohn');
    user.setEmail('john@example.com');
    user.setAvatar('https://example.com/avatar.jpg');
    user.setRole('adopter');
    user.setRules(['adopter:read', 'user:read:own']);
    user.setLatitude(-23.5505);
    user.setLongitude(-46.6333);
    user.setCreatedAt(new Date().toISOString());

    assert.strictEqual(user.getUsername(), 'AdopterJohn');
    assert.strictEqual(user.getEmail().toString(), 'john@example.com');
    assert.strictEqual(user.getAvatar()?.toString(), 'https://example.com/avatar.jpg');
    assert.strictEqual(user.getRole(), 'adopter');
    assert.strictEqual(user.getLatitude(), -23.5505);
    assert.strictEqual(user.getLongitude(), -46.6333);
  });

  it('should reject username with less than 3 characters', () => {
    const user = new User();
    assert.throws(
      () => {
        user.setUsername('ab');
      },
      { name: 'ValidationError' },
    );
  });

  it('should clear avatar when null or empty is passed', () => {
    const user = new User();
    user.setAvatar('https://example.com/avatar.jpg');
    assert.ok(user.getAvatar());

    user.setAvatar(null);
    assert.strictEqual(user.getAvatar(), null);
  });

  it('should format clean DTO and JSON without sensitive fields', () => {
    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setUsername('SafeUser');
    user.setEmail('safe@example.com');
    user.setPassword('super-secret-hashed-password');
    user.setRole('adopter');
    user.setRules(['user:read:own']);
    user.setCreatedAt(new Date().toISOString());

    const dto = user.toDTO();
    assert.strictEqual(dto.id, '123e4567-e89b-12d3-a456-426614174000');
    assert.strictEqual(dto.username, 'SafeUser');
    assert.strictEqual(dto.email, 'safe@example.com');
    assert.strictEqual((dto as unknown as { password?: string }).password, undefined);

    const json = user.toJSON();
    assert.strictEqual((json as unknown as { password?: string }).password, undefined);
  });

  it('should update rules when changing role', () => {
    const user = new User();
    user.setRole('adopter');
    user.setRules(['adopter:create', 'adopter:read']);
    user.setRole('volunteer');

    const rules = Array.from(user.getRules());
    assert.ok(rules.includes('volunteer:create'));
    assert.ok(rules.includes('volunteer:read'));
    assert.strictEqual(rules.includes('adopter:create'), false);
  });
});

describe('User Schema Validation', () => {
  it('should validate userIdParams correctly', () => {
    const valid = userIdParams.safeParse({ id: '123e4567-e89b-12d3-a456-426614174000' });
    assert.strictEqual(valid.success, true);

    const invalid = userIdParams.safeParse({});
    assert.strictEqual(invalid.success, false);
  });

  it('should validate updateProfileSchema with valid data', () => {
    const valid = updateProfileSchema.safeParse({
      username: 'UpdatedUser',
      avatar: 'https://example.com/new-avatar.png',
      latitude: -23.55,
      longitude: -46.63,
    });
    assert.strictEqual(valid.success, true);
  });

  it('should allow partial update in updateProfileSchema', () => {
    const valid = updateProfileSchema.safeParse({
      username: 'OnlyUsername',
    });
    assert.strictEqual(valid.success, true);
  });

  it('should reject invalid coordinates in updateProfileSchema', () => {
    const invalidLat = updateProfileSchema.safeParse({ latitude: 100 });
    assert.strictEqual(invalidLat.success, false);

    const invalidLng = updateProfileSchema.safeParse({ longitude: 200 });
    assert.strictEqual(invalidLng.success, false);
  });

  it('should validate updateRoleSchema correctly', () => {
    const validRoles: UserRole[] = ['adopter', 'protector', 'admin', 'volunteer'];
    for (const role of validRoles) {
      const res = updateRoleSchema.safeParse({ role });
      assert.strictEqual(res.success, true);
    }

    const invalid = updateRoleSchema.safeParse({ role: 'invalid_role' });
    assert.strictEqual(invalid.success, false);
  });

  it('should validate updateUserPasswordSchema with min length constraint', () => {
    const invalidShort = updateUserPasswordSchema.safeParse({
      currentPassword: 'currentPassword123',
      newPassword: '123',
    });
    assert.strictEqual(invalidShort.success, false);

    const valid = updateUserPasswordSchema.safeParse({
      currentPassword: 'currentPassword123',
      newPassword: 'validNewPassword123',
    });
    assert.strictEqual(valid.success, true);
  });
});

describe('UserService', () => {
  it('should update profile properties and call repository.update', async () => {
    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setUsername('OldName');
    user.setEmail('user@example.com');
    user.setRole('adopter');

    let updatedUserResult: User | undefined;
    const mockRepo = {
      findById: async () => user,
      update: async (u: User) => {
        updatedUserResult = u;
        return u;
      },
    } as unknown as import('../repositories/UserRepository').UserRepository;

    const service = new UserService(mockRepo);

    await service.updateProfile('123e4567-e89b-12d3-a456-426614174000', {
      username: 'NewName',
      avatar: 'https://example.com/avatar.jpg',
      latitude: -22.9,
      longitude: -43.1,
    });

    assert.ok(updatedUserResult);
    assert.strictEqual(updatedUserResult.getUsername(), 'NewName');
    assert.strictEqual(updatedUserResult.getAvatar()?.toString(), 'https://example.com/avatar.jpg');
    assert.strictEqual(updatedUserResult.getLatitude(), -22.9);
    assert.strictEqual(updatedUserResult.getLongitude(), -43.1);
  });

  it('should throw 404 in updateProfile if user is not found', async () => {
    const mockRepo = {
      findById: async () => null,
    } as unknown as import('../repositories/UserRepository').UserRepository;

    const service = new UserService(mockRepo);

    await assert.rejects(
      async () => {
        await service.updateProfile('123e4567-e89b-12d3-a456-426614174000', {
          username: 'NewName',
        });
      },
      (err: { statusCode?: number }) => {
        assert.strictEqual(err.statusCode, 404);
        return true;
      },
    );
  });

  it('should update user role via updateRole', async () => {
    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setEmail('user@example.com');
    user.setRole('adopter');

    const mockRepo = {
      findById: async () => user,
      update: async (u: User) => u,
    } as unknown as import('../repositories/UserRepository').UserRepository;

    const service = new UserService(mockRepo);
    const result = await service.updateRole('123e4567-e89b-12d3-a456-426614174000', 'protector');

    assert.strictEqual(result.getRole(), 'protector');
  });

  it('should delete user by id', async () => {
    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setEmail('user@example.com');

    let deletedId: unknown;
    const mockRepo = {
      findById: async () => user,
      deleteById: async (id: unknown) => {
        deletedId = id;
        return user;
      },
    } as unknown as import('../repositories/UserRepository').UserRepository;

    const service = new UserService(mockRepo);
    const result = await service.deleteById('123e4567-e89b-12d3-a456-426614174000');

    assert.ok(result);
    assert.ok(deletedId);
  });

  it('should get user with relations count', async () => {
    const mockData: UserWithRelationsCount = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      username: 'RelationsUser',
      email: 'rel@example.com',
      role: 'adopter',
      rules: ['user:read:own'],
      createdAt: new Date().toISOString(),
      counts: {
        adoptions: 3,
        events: 1,
        favorites: 5,
      },
    };

    const mockRepo = {
      findByIdCountingRelations: async () => mockData,
    } as unknown as import('../repositories/UserRepository').UserRepository;

    const service = new UserService(mockRepo);
    const result = await service.getByIdWithRelationsCount('123e4567-e89b-12d3-a456-426614174000');

    assert.strictEqual(result.counts.adoptions, 3);
    assert.strictEqual(result.counts.events, 1);
    assert.strictEqual(result.counts.favorites, 5);
  });

  it('should return user count from countAll', async () => {
    const mockRepo = {
      countAll: async () => 42,
    } as unknown as import('../repositories/UserRepository').UserRepository;

    const service = new UserService(mockRepo);
    const count = await service.countAll();
    assert.strictEqual(count, 42);
  });
});

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
    assert.strictEqual(statusCode, 200);
    const body = responseBody as { success: boolean; data: number };
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data, 15);
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
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(queriedRole, 'volunteer');
    const body = responseBody as { data: Array<{ role: string }> };
    assert.strictEqual(body.data[0].role, 'volunteer');
  });

  it('updateProfile should reject unauthenticated request', async () => {
    const controller = new UserController({} as UserService);
    const req = {} as Request;
    let forwardedError: unknown;

    await controller.updateProfile(req, {} as Response, (err) => {
      forwardedError = err;
    });

    assert.ok(forwardedError);
    assert.strictEqual((forwardedError as { statusCode: number }).statusCode, 401);
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

    assert.ok(forwardedError);
    assert.strictEqual((forwardedError as { statusCode: number }).statusCode, 400);
  });

  it('deleteMe should reject unauthenticated request', async () => {
    const controller = new UserController({} as UserService);
    const req = {} as Request;
    let forwardedError: unknown;

    await controller.deleteMe(req, {} as Response, (err) => {
      forwardedError = err;
    });

    assert.ok(forwardedError);
    assert.strictEqual((forwardedError as { statusCode: number }).statusCode, 401);
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

    assert.ok(forwardedError);
    assert.strictEqual((forwardedError as { statusCode: number }).statusCode, 400);
  });
});

describe('UserRouter Endpoints Coverage', () => {
  it('should define all 11 user routes with correct HTTP methods and paths', () => {
    const mockController = {
      countAll: () => {},
      getAll: () => {},
      register: () => {},
      signIn: () => {},
      userInfo: () => {},
      updateProfile: () => {},
      deleteMe: () => {},
      updatePassword: () => {},
      getById: () => {},
      updateRole: () => {},
      deleteById: () => {},
    } as unknown as UserController;

    const userRouter = new UserRouter(mockController);
    const registered = userRouter.router.stack.map((layer) => ({
      path: layer.route?.path,
      methods: (layer.route as { methods?: Record<string, boolean> } | undefined)?.methods,
    }));

    // Public routes
    assert.ok(registered.some((r) => r.path === '/count' && r.methods?.get));
    assert.ok(registered.some((r) => r.path === '/create' && r.methods?.post));
    assert.ok(registered.some((r) => r.path === '/signin' && r.methods?.post));

    // Admin collection route
    assert.ok(registered.some((r) => r.path === '/all' && r.methods?.get));

    // Authenticated user own routes
    assert.ok(registered.some((r) => r.path === '/me' && r.methods?.get));
    assert.ok(registered.some((r) => r.path === '/me' && r.methods?.patch));
    assert.ok(registered.some((r) => r.path === '/me' && r.methods?.delete));
    assert.ok(registered.some((r) => r.path === '/me/password' && r.methods?.patch));

    // Individual user routes
    assert.ok(registered.some((r) => r.path === '/:id' && r.methods?.get));
    assert.ok(registered.some((r) => r.path === '/:id/role' && r.methods?.patch));
    assert.ok(registered.some((r) => r.path === '/:id' && r.methods?.delete));
  });
});
