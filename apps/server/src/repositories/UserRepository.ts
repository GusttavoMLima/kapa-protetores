import { UserRole } from '@kapa/shared';
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
    user.setLatitude(record.latitude === null ? null : Number(record.latitude));
    user.setLongitude(record.longitude === null ? null : Number(record.longitude));
    user.setCreatedAt(record.created_at.toISOString());

    return user;
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

  async findByIdValue(id: string): Promise<User | null> {
    const data = await this.prisma.user.findUnique({ where: { id } });
    return data ? this.mapToDomain(data) : null;
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
    const userCreation = await this.prisma.user.create({
      data: {
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
          avatar: user.getAvatar()?.toString() ?? undefined,
          latitude: user.getLatitude() ?? undefined,
          longitude: user.getLongitude() ?? undefined,
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
