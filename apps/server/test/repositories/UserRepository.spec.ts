import { UserRepository } from '../../src/repositories/UserRepository';
import { UUID } from '../../src/domains/UUID';
import type { PrismaClient } from '@prisma/client';

describe('UserRepository', () => {
  it('should map user with relations count and data correctly in UserRepository', async () => {
    const mockPrisma = {
      user: {
        findUnique: async () => ({
          id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'JohnDoe',
          email: 'john@example.com',
          avatar: 'https://example.com/avatar.png',
          role: 'adopter',
          rules: ['rule1'],
          latitude: '10.5',
          longitude: '-20.5',
          created_at: new Date('2026-01-01T00:00:00Z'),
          favorites: [
            {
              user_id: '123e4567-e89b-12d3-a456-426614174000',
              animal_id: 'animal-1',
              created_at: new Date('2026-01-02T00:00:00Z'),
              animal: {
                id: 'animal-1',
                name: 'Rex',
                gender: 'male',
                age: 3,
                photos: [
                  {
                    photo_url: 'https://example.com/rex.png',
                  },
                ],
              },
            },
          ],
          events: [
            {
              id: 'event-1',
              type: 'USER_LOGIN',
              user_id: '123e4567-e89b-12d3-a456-426614174000',
              animal_id: null,
              payload: { ip: '127.0.0.1' },
              emitted_at: new Date('2026-01-02T00:00:00Z'),
            },
          ],
          _count: {
            adoptions: 2,
            events: 1,
            favorites: 1,
          },
        }),
      },
    } as unknown as PrismaClient;

    const repo = new UserRepository(mockPrisma);
    const result = await repo.findByIdCountingAndDataOfRelations(
      UUID.create('123e4567-e89b-12d3-a456-426614174000'),
    );

    expect(result).toBeDefined();
    expect(result!.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(result!.latitude).toBe(10.5);
    expect(result!.counts.adoptions).toBe(2);
    expect(result!.favorites.length).toBe(1);
    expect(result!.favorites[0].animal?.name).toBe('Rex');
    expect(result!.favorites[0].animal?.gender).toBe('male');
    expect(result!.favorites[0].animal?.age).toBe(3);
    expect(result!.favorites[0].animal?.photo).toBe('https://example.com/rex.png');
    expect(result!.events.length).toBe(1);
    expect(result!.events[0].type).toBe('USER_LOGIN');
  });

  it('should map null latitude and longitude to null instead of 0', async () => {
    const mockPrisma = {} as unknown as PrismaClient;
    const repo = new UserRepository(mockPrisma);

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
    expect(user.getLatitude()).toBeNull();
    expect(user.getLongitude()).toBeNull();

    const dto = user.toDTO();
    expect(dto.latitude).toBeNull();
    expect(dto.longitude).toBeNull();
  });
});
