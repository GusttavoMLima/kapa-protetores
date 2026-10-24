import {
  CreateUserInput,
  SystemEventTypes,
  UserRole,
  UserWithRelationsCount,
  UserWithCountAndDataOfRelations,
  DEFAULT_USER_ADOPTER_RULES,
} from '@kapa/shared';
import { OAuth2Client } from 'google-auth-library';
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  InternalServerError,
  ConflictError,
  BaseError,
  ServiceError,
} from '../errors';
import { User } from '../models';
import { UserRepository } from '../repositories/UserRepository';
import { Email } from '../domains/Email';
import { UUID } from '../domains/UUID';
import { Url } from '../domains/Url';
import { PasswordHasher } from '../security/PasswordHasher';
import type { CacheProvider } from './RedisService';
import type { EventsService } from './EventsService';

export function buildUserProfileCacheKey(userId: string): string {
  return `user:profile:${userId}`;
}

export function buildUserCountsCacheKey(userId: string): string {
  return `user:counts:${userId}`;
}

const USER_PROFILE_CACHE_TTL_SECONDS = 60;

const googleClient = new OAuth2Client();

export class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly cache?: CacheProvider,
    private readonly eventsService?: EventsService,
  ) {}

  public async authenticateWithGoogle(idToken: string) {
    const audiences = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_WEB_CLIENT_ID,
      process.env.GOOGLE_IOS_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
    ].filter((id): id is string => Boolean(id));

    if (audiences.length === 0) throw new UnauthorizedError('Login Google indisponível.');

    let email: string | undefined;
    let name: string | undefined;
    let picture: string | undefined;

    const isJwt = idToken.split('.').length === 3;

    if (isJwt) {
      let ticket;

      try {
        ticket = await googleClient.verifyIdToken({
          idToken,
          audience: audiences.length > 0 ? audiences : undefined,
        });
      } catch {
        throw new UnauthorizedError('Token do Google inválido ou expirado');
      }

      const payload = ticket.getPayload();

      if (!payload || !payload.email || !payload.email_verified) {
        throw new UnauthorizedError('Email do Google não verificado');
      }

      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    } else {
      try {
        const tokenInfo = await googleClient.getTokenInfo(idToken);
        if (audiences.length > 0 && !audiences.includes(tokenInfo.aud)) {
          throw new UnauthorizedError('Audience do token Google inválida');
        }

        const userInfoResponse = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: { Authorization: `Bearer ${idToken}` },
          },
        );

        if (!userInfoResponse.ok) {
          throw new UnauthorizedError('Token do Google inválido ou expirado');
        }

        const userInfo = (await userInfoResponse.json()) as {
          email?: string;
          email_verified?: boolean;
          name?: string;
          picture?: string;
        };

        if (!userInfo.email || !userInfo.email_verified) {
          throw new UnauthorizedError('Email do Google não verificado');
        }

        email = userInfo.email;
        name = userInfo.name;
        picture = userInfo.picture;
      } catch (error) {
        if (error instanceof BaseError) {
          throw error;
        }
        throw new UnauthorizedError('Token do Google inválido ou expirado');
      }
    }

    if (!email) {
      throw new ServiceError('Email não encontrado no payload do Google.');
    }

    const safeEmail = Email.create(email);
    let user = await this.repository.findByEmail(safeEmail);

    if (user) {
      if (picture && user.getAvatar()?.toString() !== picture) {
        user = await this.updateAvatar(user.getId().toString(), picture);
      }
      return user;
    }

    const username = name || email.split('@')[0];

    user = await this.create({
      username,
      email,
      avatar: picture ?? undefined,
      role: 'adopter',
      rules: Array.from(DEFAULT_USER_ADOPTER_RULES),
    });

    return user;
  }

  public async getByIdWithRelationsCount(
    id: string,
  ): Promise<UserWithRelationsCount> {
    const safeId = UUID.create(id);
    const cacheKey = buildUserCountsCacheKey(safeId.toString());

    if (this.cache) {
      const cached =
        await this.cache.getCache<UserWithRelationsCount>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const user = await this.repository.findByIdCountingRelations(safeId);

    if (!user) {
      throw new NotFoundError(`User with ID: ${id} not found`);
    }

    if (this.cache) {
      await this.cache.setCache(
        cacheKey,
        user,
        USER_PROFILE_CACHE_TTL_SECONDS,
      );
    }

    return user;
  }

  public async getByIdWithRelationsData(id: string) {
    const safeId = UUID.create(id);
    const cacheKey = buildUserProfileCacheKey(safeId.toString());

    if (this.cache) {
      const cached =
        await this.cache.getCache<UserWithCountAndDataOfRelations>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const user =
      await this.repository.findByIdCountingAndDataOfRelations(safeId);

    if (!user) {
      throw new NotFoundError(`User With ID: ${id} not found`);
    }

    if (this.cache) {
      await this.cache.setCache(
        cacheKey,
        user,
        USER_PROFILE_CACHE_TTL_SECONDS,
      );
    }

    return user;
  }

  public async countAll(): Promise<number> {
    return this.repository.countAll();
  }

  public async getAll() {
    return this.repository.findAll();
  }

  public async getById(id: string) {
    const safeId = UUID.create(id);

    const user = await this.repository.findById(safeId);

    if (!user) {
      throw new NotFoundError(`User with ID: ${id} not found`);
    }

    return user;
  }

  public async getByEmail(email: string) {
    const safeEmail = Email.create(email);

    const user = await this.repository.findByEmail(safeEmail);

    if (!user) {
      throw new NotFoundError(`User not found by email: ${email}`);
    }

    return user;
  }

  public async getAllByRole(role: UserRole) {
    return this.repository.findAllByRole(role);
  }

  public async getAllByRules(rules: string[]) {
    return this.repository.findAllByHasRules(rules);
  }

  public async getAllByUsername(username: string) {
    return this.repository.findAllByHasUsername(username);
  }

  public async getAllByCreatedAt(createdAt: Date) {
    return this.repository.findAllByCreatedAt(createdAt);
  }

  public async create(input: CreateUserInput) {
    if (!input || typeof input !== 'object') {
      throw new BadRequestError('User data invalid.');
    }

    if (!input.email) {
      throw new BadRequestError('Email is required.');
    }

    if (!input.username) {
      throw new BadRequestError('Username is required.');
    }

    const hasedPassword = input.password
      ? await new PasswordHasher().hash(input.password)
      : undefined;

    const user = new User();
    user.setUsername(input.username);
    user.setEmail(input.email);
    user.setAvatar(input.avatar);
    user.setPassword(hasedPassword);
    if (input.role) user.setRole(input.role satisfies UserRole);
    if (input.rules) user.setRules(input.rules);
    user.setLatitude(input.latitude);
    user.setLongitude(input.longitude);

    const created = await this.repository.create(user);
    if (this.eventsService) {
      await this.eventsService.createEvent({
        type: SystemEventTypes.USER_REGISTERED,
        userId: created.getId().toString(),
        payload: {
          role: created.getRole(),
          provider: input.password ? 'local' : 'google',
        },
      });
    }
    return created;
  }

  public async updateAvatar(id: string, url: string) {
    const safeId = UUID.create(id);
    const safeUrl = Url.create(url);
    const user = await this.repository.updateAvatar(safeId, safeUrl);

    if (!user) {
      throw new NotFoundError(`User Could not updated.`);
    }

    if (this.cache) {
      await Promise.all([
        this.cache.deleteCache(buildUserProfileCacheKey(safeId.toString())),
        this.cache.deleteCache(buildUserCountsCacheKey(safeId.toString())),
      ]);
    }

    return user;
  }

  public async updatePassword(
    id: string,
    currentPasswordPlainText: string,
    newPasswordPlainText: string,
  ): Promise<void> {
    const safeId = UUID.create(id);

    const user = await this.repository.findById(safeId);

    if (!user) {
      throw new NotFoundError(`Usuário não encontrado`);
    }

    const storedHash = user.getPassword();

    if (!storedHash) {
      throw new BadRequestError(
        'Esta conta foi criada com o Google e não possui senha definida.',
      );
    }

    const isCurrentPasswordValid = await new PasswordHasher().verify(
      currentPasswordPlainText,
      storedHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError('Senha atual incorreta');
    }

    if (await new PasswordHasher().verify(newPasswordPlainText, storedHash)) {
      throw new BadRequestError('A nova senha deve ser diferente da senha atual');
    }

    const newHashedPassword = await new PasswordHasher().hash(newPasswordPlainText);
    const updatedUser = await this.repository.updatePassword(safeId, newHashedPassword);

    if (!updatedUser) {
      throw new InternalServerError('Erro ao atualizar a senha do usuário');
    }
  }

  public async updateProfile(
    id: string,
    input: {
      username?: string;
      email?: string;
      avatar?: string | null;
      latitude?: number | null;
      longitude?: number | null;
    },
  ): Promise<User> {
    const safeId = UUID.create(id);
    const user = await this.repository.findById(safeId);

    if (!user) {
      throw new NotFoundError(`Usuário não encontrado`);
    }

    if (input.email !== undefined && input.email !== user.getEmail().toString()) {
      const safeEmail = Email.create(input.email);
      const existing = await this.repository.findByEmail(safeEmail);
      if (existing && existing.getId().toString() !== user.getId().toString()) {
        throw new ConflictError('Já existe um usuário cadastrado com este e-mail');
      }
      user.setEmail(safeEmail);
    }

    if (input.username !== undefined) {
      user.setUsername(input.username);
    }

    if (input.avatar !== undefined) {
      user.setAvatar(input.avatar);
    }

    if (input.latitude !== undefined) {
      user.setLatitude(input.latitude);
    }

    if (input.longitude !== undefined) {
      user.setLongitude(input.longitude);
    }

    const updatedUser = await this.repository.update(user);

    if (!updatedUser) {
      throw new InternalServerError('Erro ao atualizar dados do usuário');
    }

    if (this.cache) {
      await Promise.all([
        this.cache.deleteCache(buildUserProfileCacheKey(safeId.toString())),
        this.cache.deleteCache(buildUserCountsCacheKey(safeId.toString())),
      ]);
    }

    return updatedUser;
  }

  public async updateRole(id: string, role: UserRole): Promise<User> {
    const safeId = UUID.create(id);
    const user = await this.repository.findById(safeId);

    if (!user) {
      throw new NotFoundError(`Usuário não encontrado`);
    }

    user.setRole(role);
    const updatedUser = await this.repository.update(user);

    if (!updatedUser) {
      throw new InternalServerError('Erro ao atualizar papel do usuário');
    }

    if (this.cache) {
      await Promise.all([
        this.cache.deleteCache(buildUserProfileCacheKey(safeId.toString())),
        this.cache.deleteCache(buildUserCountsCacheKey(safeId.toString())),
      ]);
    }

    return updatedUser;
  }

  public async deleteById(id: string): Promise<User> {
    const safeId = UUID.create(id);
    const user = await this.repository.findById(safeId);

    if (!user) {
      throw new NotFoundError(`Usuário não encontrado`);
    }

    const deleted = await this.repository.deleteById(safeId);

    if (this.cache) {
      await Promise.all([
        this.cache.deleteCache(buildUserProfileCacheKey(safeId.toString())),
        this.cache.deleteCache(buildUserCountsCacheKey(safeId.toString())),
      ]);
    }

    return deleted;
  }
}
