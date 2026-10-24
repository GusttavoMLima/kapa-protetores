import { SystemEventTypes } from '@kapa/shared';
import { NotFoundError } from '../errors';
import { FavoriteRepository } from '../repositories/FavoriteRepository';
import {
  buildUserCountsCacheKey,
  buildUserProfileCacheKey,
} from './UserService';
import type { CacheProvider } from './RedisService';
import type { EventsService } from './EventsService';

export class FavoriteService {
  constructor(
    private readonly repository: FavoriteRepository,
    private readonly cache?: CacheProvider,
    private readonly eventsService?: EventsService,
  ) {}

  public async toggle(userId: string, animalId: string): Promise<boolean> {
    try {
      const favorited = await this.repository.toggle(userId, animalId);
      if (this.eventsService) {
        await this.eventsService.createEvent({
          type: favorited
            ? SystemEventTypes.PET_FAVORITED
            : SystemEventTypes.PET_UNFAVORITED,
          userId,
          animalId,
          payload: {},
        });
      }
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
