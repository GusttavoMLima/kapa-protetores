import {
  UserRole,
  UserWithRelationsCount,
  UserWithCountAndDataOfRelations,
} from '@kapa/shared';
import { Email } from '../domains/Email';
import { Url } from '../domains/Url';
import { UUID } from '../domains/UUID';
import { IUserRepository } from '../interfaces/IUserRepository';
import { User } from '../models';
import { PrismaClient } from '@prisma/client';
import type { User as PrismaUser } from '@prisma/client';

export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private mapToDomain(record: PrismaUser) {
    const user = new User();
    user.setId(record.id);
    user.setUsername(record.username);
    user.setEmail(record.email);
    user.setPassword(record.password);
    user.setAvatar(record.avatar);
    user.setRole(record.role);
    user.setRules(record.rules);
    user.setLatitude(record.latitude != null ? Number(record.latitude) : null);
    user.setLongitude(
      record.longitude != null ? Number(record.longitude) : null,
    );
    user.setCreatedAt(record.created_at.toISOString());

    return user;
  }

  async countAll(): Promise<number> {
    return await this.prisma.user.count();
  }

  async findAll(): Promise<User[]> {
    const data = await this.prisma.user.findMany();
    const users = data.map((user) => this.mapToDomain(user));

    return users;
  }

  async findById(id: UUID): Promise<User | null> {
    const data = await this.prisma.user.findUnique({
      where: {
        id: id.toString(),
      },
    });

    if (!data) return null;

    const user = this.mapToDomain(data);

    return user;
  }

  async findByIdCountingRelations(
    id: UUID,
  ): Promise<UserWithRelationsCount | null> {
    const data = await this.prisma.user.findUnique({
      where: {
        id: id.toString(),
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        rules: true,
        latitude: true,
        longitude: true,
        created_at: true,
        _count: {
          select: {
            adoptions: true,
            events: true,
            favorites: true,
          },
        },
      },
    });

    if (!data) return null;

    return {
      id: data.id,
      username: data.username,
      email: data.email,
      avatar: data.avatar,
      role: data.role,
      rules: data.rules,
      latitude: data.latitude != null ? Number(data.latitude) : null,
      longitude: data.longitude != null ? Number(data.longitude) : null,
      createdAt: data.created_at.toISOString(),
      counts: {
        adoptions: data._count.adoptions,
        events: data._count.events,
        favorites: data._count.favorites,
      },
    };
  }

  async findByIdValue(id: string): Promise<User | null> {
    const data = await this.prisma.user.findUnique({ where: { id } });
    return data ? this.mapToDomain(data) : null;
  }

  async findByIdCountingAndDataOfRelations(
    id: UUID,
  ): Promise<UserWithCountAndDataOfRelations | null> {
    const data = await this.prisma.user.findUnique({
      where: {
        id: id.toString(),
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        favorites: {
          take: 4,
          select: {
            user_id: true,
            animal_id: true,
            created_at: true,
            animal: {
              select: {
                id: true,
                name: true,
                gender: true,
                age: true,
                photos: {
                  take: 1,
                  select: {
                    photo_url: true,
                  },
                },
              },
            },
          },
        },
        events: {
          take: 2,
        },
        _count: {
          select: {
            adoptions: true,
            events: true,
            favorites: true,
          },
        },
      },
    });

    if (!data) return null;

    return {
      id: data.id,
      latitude: data.latitude != null ? Number(data.latitude) : null,
      longitude: data.longitude != null ? Number(data.longitude) : null,
      counts: {
        adoptions: data._count.adoptions,
        events: data._count.events,
        favorites: data._count.favorites,
      },
      favorites: data.favorites.map((fav) => ({
        userId: fav.user_id,
        animalId: fav.animal_id,
        createdAt: fav.created_at.toISOString(),
        animal: fav.animal
          ? {
              id: fav.animal.id,
              name: fav.animal.name,
              gender: fav.animal.gender,
              age: fav.animal.age,
              photo: fav.animal.photos[0]?.photo_url ?? null,
            }
          : undefined,
      })),
      events: data.events.map((evt) => ({
        id: evt.id,
        type: evt.type,
        userId: evt.user_id,
        animalId: evt.animal_id,
        payload: evt.payload as Record<string, unknown> | null,
        emittedAt: evt.emitted_at.toISOString(),
      })),
    };
  }

  async findByEmail(email: Email): Promise<User | null> {
    const data = await this.prisma.user.findUnique({
      where: {
        email: email.toString(),
      },
    });

    if (!data) return null;

    return this.mapToDomain(data);
  }

  async findAllByRole(role: UserRole): Promise<User[]> {
    const data = await this.prisma.user.findMany({
      where: {
        role,
      },
    });

    const users = data.map((user) => this.mapToDomain(user));

    return users;
  }

  async findAllByHasRules(rules: string[]): Promise<User[]> {
    const data = await this.prisma.user.findMany({
      where: {
        rules: {
          hasEvery: rules,
        },
      },
    });

    const users = data.map((user) => this.mapToDomain(user));

    return users;
  }

  async findAllByHasUsername(username: string): Promise<User[]> {
    const data = await this.prisma.user.findMany({
      where: {
        username: {
          contains: username,
        },
      },
    });

    const users = data.map((user) => this.mapToDomain(user));

    return users;
  }

  async findAllByCreatedAt(deadLine: Date): Promise<User[]> {
    const data = await this.prisma.user.findMany({
      where: {
        created_at: {
          lt: deadLine,
        },
      },
    });

    const users = data.map((user) => this.mapToDomain(user));

    return users;
  }

  async create(user: User): Promise<User> {
    const id = user.getId() ? user.getId().toString() : undefined;
    const userCreation = await this.prisma.user.create({
      data: {
        ...(id ? { id } : {}),
        username: user.getUsername(),
        email: user.getEmail().toString(),
        password: user.getPassword() ?? undefined,
        role: user.getRole(),
        rules: [...user.getRules()],
        avatar: user.getAvatar()?.toString() ?? undefined,
        latitude: user.getLatitude() ?? undefined,
        longitude: user.getLongitude() ?? undefined,
      },
    });

    return this.mapToDomain(userCreation);
  }

  async updateAvatar(id: UUID, url: Url): Promise<User> {
    return this.mapToDomain(
      await this.prisma.user.update({
        where: {
          id: id.toString(),
        },
        data: {
          avatar: url.toString(),
        },
      }),
    );
  }

  async updatePassword(id: UUID, password: string): Promise<User> {
    return this.mapToDomain(
      await this.prisma.user.update({
        where: {
          id: id.toString(),
        },
        data: {
          password,
        },
      }),
    );
  }

  async updatedLatAndLong(id: UUID, lat: number, long: number): Promise<User> {
    return this.mapToDomain(
      await this.prisma.user.update({
        where: {
          id: id.toString(),
        },
        data: {
          latitude: lat,
          longitude: long,
        },
      }),
    );
  }

  async update(user: User): Promise<User> {
    return this.mapToDomain(
      await this.prisma.user.update({
        where: {
          id: user.getId().toString(),
        },
        data: {
          username: user.getUsername(),
          email: user.getEmail().toString(),
          password: user.getPassword() ?? undefined,
          role: user.getRole(),
          rules: [...user.getRules()],
          avatar:
            user.getAvatar() !== undefined
              ? (user.getAvatar()?.toString() ?? null)
              : undefined,
          latitude:
            user.getLatitude() !== undefined ? user.getLatitude() : undefined,
          longitude:
            user.getLongitude() !== undefined ? user.getLongitude() : undefined,
        },
      }),
    );
  }

  async deleteById(id: UUID): Promise<User> {
    return this.mapToDomain(
      await this.prisma.user.delete({
        where: {
          id: id.toString(),
        },
      }),
    );
  }
}
