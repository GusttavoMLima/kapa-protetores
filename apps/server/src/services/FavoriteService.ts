import { NotFoundError } from '../errors';
import { FavoriteRepository } from '../repositories/FavoriteRepository';
import {
  buildUserCountsCacheKey,
  buildUserProfileCacheKey,
} from './UserService';
import type { CacheProvider } from './RedisService';

export class FavoriteService {
  constructor(
    private readonly repository: FavoriteRepository,
    private readonly cache?: CacheProvider,
  ) {}

  public async toggle(userId: string, animalId: string): Promise<boolean> {
    try {
      const favorited = await this.repository.toggle(userId, animalId);
      if (this.cache) {
        await Promise.all([
          this.cache.deleteCache(buildUserProfileCacheKey(userId)),
          this.cache.deleteCache(buildUserCountsCacheKey(userId)),
        ]);
      }
      return favorited;
    } catch (error) {
      if (error instanceof Error && error.message === 'ANIMAL_NOT_FOUND') {
        throw new NotFoundError('Animal não encontrado.');
      }
      throw error;
    }
  }
}
