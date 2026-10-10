import { User } from '../../src/models/User';
import { UserService } from '../../src/services/UserService';
import type { UserRepository } from '../../src/repositories/UserRepository';
import type { UserWithRelationsCount } from '@kapa/shared';
import { Encrypt } from '../../src/utils/Encypt';
import { PasswordHasher } from '../../src/security/PasswordHasher';

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
    } as unknown as UserRepository;

    const service = new UserService(mockRepo);

    await service.updateProfile('123e4567-e89b-12d3-a456-426614174000', {
      username: 'NewName',
      avatar: 'https://example.com/avatar.jpg',
      latitude: -22.9,
      longitude: -43.1,
    });

    expect(updatedUserResult).toBeDefined();
    expect(updatedUserResult!.getUsername()).toBe('NewName');
    expect(updatedUserResult!.getAvatar()?.toString()).toBe('https://example.com/avatar.jpg');
    expect(updatedUserResult!.getLatitude()).toBe(-22.9);
    expect(updatedUserResult!.getLongitude()).toBe(-43.1);
  });

  it('should throw 404 in updateProfile if user is not found', async () => {
    const mockRepo = {
      findById: async () => null,
    } as unknown as UserRepository;

    const service = new UserService(mockRepo);

    await expect(
      service.updateProfile('123e4567-e89b-12d3-a456-426614174000', {
        username: 'NewName',
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('should update user role via updateRole', async () => {
    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setEmail('user@example.com');
    user.setRole('adopter');

    const mockRepo = {
      findById: async () => user,
      update: async (u: User) => u,
    } as unknown as UserRepository;

    const service = new UserService(mockRepo);
    const result = await service.updateRole('123e4567-e89b-12d3-a456-426614174000', 'protector');

    expect(result.getRole()).toBe('protector');
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
    } as unknown as UserRepository;

    const service = new UserService(mockRepo);
    const result = await service.deleteById('123e4567-e89b-12d3-a456-426614174000');

    expect(result).toBeDefined();
    expect(deletedId).toBeDefined();
    expect(String(deletedId)).toBe('123e4567-e89b-12d3-a456-426614174000');
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
    } as unknown as UserRepository;

    const service = new UserService(mockRepo);
    const result = await service.getByIdWithRelationsCount('123e4567-e89b-12d3-a456-426614174000');

    expect(result.counts.adoptions).toBe(3);
    expect(result.counts.events).toBe(1);
    expect(result.counts.favorites).toBe(5);
  });

  it('should return user count from countAll', async () => {
    const mockRepo = {
      countAll: async () => 42,
    } as unknown as UserRepository;

    const service = new UserService(mockRepo);
    const count = await service.countAll();
    expect(count).toBe(42);
  });

  it('getByIdWithRelationsData should return user relations data', async () => {
    const mockRepo = {
      findByIdCountingAndDataOfRelations: async () => ({
        id: '123e4567-e89b-12d3-a456-426614174000',
        latitude: -23.5505,
        longitude: -46.6333,
        counts: { adoptions: 1, events: 2, favorites: 3 },
        favorites: [],
        events: [],
      }),
    } as unknown as UserRepository;

    const service = new UserService(mockRepo);
    const result = await service.getByIdWithRelationsData('123e4567-e89b-12d3-a456-426614174000');
    expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(result.counts.adoptions).toBe(1);
  });

  it('getByIdWithRelationsData should throw 404 when user is not found', async () => {
    const mockRepo = {
      findByIdCountingAndDataOfRelations: async () => null,
    } as unknown as UserRepository;

    const service = new UserService(mockRepo);
    await expect(
      service.getByIdWithRelationsData('123e4567-e89b-12d3-a456-426614174000'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  describe('Google Authentication', () => {
    it('should reject invalid or malformed token with UnauthorizedError', async () => {
      const mockRepo = {} as unknown as UserRepository;
      const service = new UserService(mockRepo);

      await expect(
        service.authenticateWithGoogle('malformed.jwt.token'),
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should reject invalid non-jwt token with UnauthorizedError', async () => {
      const mockRepo = {} as unknown as UserRepository;
      const service = new UserService(mockRepo);

      await expect(
        service.authenticateWithGoogle('invalid_opaque_token'),
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('updatePassword', () => {
    it('should throw 400 when user has no password (e.g. Google-created account)', async () => {
      const user = new User();
      user.setId('123e4567-e89b-12d3-a456-426614174000');
      user.setEmail('google@example.com');

      const mockRepo = {
        findById: async () => user,
      } as unknown as UserRepository;

      const service = new UserService(mockRepo);

      await expect(
        service.updatePassword(
          '123e4567-e89b-12d3-a456-426614174000',
          'anyPass',
          'newPass123',
        ),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 401 when current password does not match', async () => {
      const user = new User();
      user.setId('123e4567-e89b-12d3-a456-426614174000');
      user.setEmail('user@example.com');
      user.setPassword(Encrypt.saltHash('correctCurrentPassword').toString('hex'));

      const mockRepo = {
        findById: async () => user,
      } as unknown as UserRepository;

      const service = new UserService(mockRepo);

      await expect(
        service.updatePassword(
          '123e4567-e89b-12d3-a456-426614174000',
          'wrongCurrentPassword',
          'newPass123',
        ),
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 400 when new password is the same as current password', async () => {
      const user = new User();
      user.setId('123e4567-e89b-12d3-a456-426614174000');
      user.setEmail('user@example.com');
      user.setPassword(Encrypt.saltHash('samePassword123').toString('hex'));

      const mockRepo = {
        findById: async () => user,
      } as unknown as UserRepository;

      const service = new UserService(mockRepo);

      await expect(
        service.updatePassword(
          '123e4567-e89b-12d3-a456-426614174000',
          'samePassword123',
          'samePassword123',
        ),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should successfully update password when inputs are valid', async () => {
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
      } as unknown as UserRepository;

      const service = new UserService(mockRepo);

      await service.updatePassword(
        '123e4567-e89b-12d3-a456-426614174000',
        'oldPassword123',
        'brandNewPassword123',
      );

      expect(savedHash).toBeDefined();
      expect(
        await new PasswordHasher().verify('brandNewPassword123', savedHash!),
      ).toBe(true);
    });
  });
});
