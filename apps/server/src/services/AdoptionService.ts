import {
  SystemEventTypes,
  type Adoption,
  type AdoptionApplication,
} from '@kapa/shared';
import { ConflictError, NotFoundError } from '../errors';
import { AdoptionRepository } from '../repositories/AdoptionRepository';
import {
  AVAILABLE_ANIMALS_CACHE_KEY,
  buildPublicAnimalCacheKey,
} from './AnimalService';
import {
  buildUserCountsCacheKey,
  buildUserProfileCacheKey,
} from './UserService';
import type { CacheProvider } from './RedisService';
import type { EventsService } from './EventsService';
import { SHELTER_BUDGET_PREDICTION_CACHE_KEY } from './PredictionService';

const ADOPTIONS_CACHE_TTL_SECONDS = 60;
const ADMIN_ADOPTIONS_CACHE_KEY = 'adoptions:admin:all';

export function buildAdopterAdoptionsCacheKey(adopterId: string): string {
  return `adoptions:user:${adopterId}`;
}

export class AdoptionService {
  constructor(
    private readonly repository: AdoptionRepository,
    private readonly cache?: CacheProvider,
    private readonly eventsService?: EventsService,
  ) {}

  public async create(adopterId: string, animalId: string, application: AdoptionApplication): Promise<Adoption> {
    try {
      const created = await this.repository.create(adopterId, animalId, application);
      if (this.eventsService) {
        await this.eventsService.createEvent({
          type: SystemEventTypes.ADOPTION_REQUESTED,
          userId: adopterId,
          animalId,
          payload: { adoptionId: created.id },
        });
      }
      if (this.cache) {
        await Promise.all([
          this.cache.deleteCache(buildAdopterAdoptionsCacheKey(adopterId)),
          this.cache.deleteCache(ADMIN_ADOPTIONS_CACHE_KEY),
          this.cache.deleteCache(buildUserProfileCacheKey(adopterId)),
          this.cache.deleteCache(buildUserCountsCacheKey(adopterId)),
        ]);
      }
      return created;
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (error.message === 'ANIMAL_NOT_FOUND') {
        throw new NotFoundError('Animal não encontrado.');
      }
      if (error.message === 'ANIMAL_NOT_AVAILABLE') {
        throw new ConflictError('Este animal não está mais disponível para adoção.');
      }
      if (error.message === 'ADOPTION_ALREADY_REQUESTED') {
        throw new ConflictError('Você já possui uma solicitação ativa para este animal.');
      }
      throw error;
    }
  }

  public async listForAdmin(): Promise<Adoption[]> {
    if (this.cache) {
      const cached = await this.cache.getCache<Adoption[]>(
        ADMIN_ADOPTIONS_CACHE_KEY,
      );
      if (cached) {
        return cached;
      }
    }

    const adoptions = await this.repository.listForAdmin();
    if (this.cache) {
      await this.cache.setCache(
        ADMIN_ADOPTIONS_CACHE_KEY,
        adoptions,
        ADOPTIONS_CACHE_TTL_SECONDS,
      );
    }
    return adoptions;
  }

  public async listForAdopter(adopterId: string): Promise<Adoption[]> {
    const cacheKey = buildAdopterAdoptionsCacheKey(adopterId);
    if (this.cache) {
      const cached = await this.cache.getCache<Adoption[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const adoptions = await this.repository.listForAdopter(adopterId);
    if (this.cache) {
      await this.cache.setCache(
        cacheKey,
        adoptions,
        ADOPTIONS_CACHE_TTL_SECONDS,
      );
    }
    return adoptions;
  }

  public async updateStatus(id: string, status: Adoption['status']): Promise<Adoption> {
    const updated = await this.repository.updateStatus(id, status);
    if (this.eventsService) {
      if (status === 'approved') {
        await this.eventsService.createEvent({
          type: SystemEventTypes.ADOPTION_APPROVED,
          userId: updated.adopterId,
          animalId: updated.animalId,
          payload: { adoptionId: updated.id },
        });
      } else if (status === 'rejected') {
        await this.eventsService.createEvent({
          type: SystemEventTypes.ADOPTION_REJECTED,
          userId: updated.adopterId,
          animalId: updated.animalId,
          payload: { adoptionId: updated.id },
        });
      } else if (status === 'canceled') {
        await this.eventsService.createEvent({
          type: SystemEventTypes.ADOPTION_CANCELED,
          userId: updated.adopterId,
          animalId: updated.animalId,
          payload: { adoptionId: updated.id },
        });
      }
    }
    if (this.cache) {
      await Promise.all([
        this.cache.deleteCache(ADMIN_ADOPTIONS_CACHE_KEY),
        updated.adopterId
          ? this.cache.deleteCache(
              buildAdopterAdoptionsCacheKey(updated.adopterId),
            )
          : Promise.resolve(),
        updated.adopterId
          ? this.cache.deleteCache(buildUserProfileCacheKey(updated.adopterId))
          : Promise.resolve(),
        updated.adopterId
          ? this.cache.deleteCache(buildUserCountsCacheKey(updated.adopterId))
          : Promise.resolve(),
        this.cache.deleteCache(AVAILABLE_ANIMALS_CACHE_KEY),
        this.cache.deleteCache(SHELTER_BUDGET_PREDICTION_CACHE_KEY),
        updated.animalId
          ? this.cache.deleteCache(buildPublicAnimalCacheKey(updated.animalId))
          : Promise.resolve(),
      ]);
    }
    return updated;
  }
}
