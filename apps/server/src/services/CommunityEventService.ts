import type { CommunityEventListItem } from '@kapa/shared';
import { NotFoundError, ConflictError } from '../errors';
import { CommunityEventRepository } from '../repositories/CommunityEventRepository';
import type { CreateCommunityEventData } from '../validation/communityEventSchema';
import type { CacheProvider } from './RedisService';

const COMMUNITY_EVENTS_MANAGER_CACHE_KEY = 'community-events:manager';
const COMMUNITY_EVENTS_CACHE_TTL_SECONDS = 60;

export class CommunityEventService {
  constructor(
    private readonly repository: CommunityEventRepository,
    private readonly cache?: CacheProvider,
  ) {}

  public listUpcomingForVolunteer(
    volunteerId: string,
  ): Promise<CommunityEventListItem[]> {
    return this.repository.listUpcomingForVolunteer(volunteerId);
  }

  public async listUpcomingForManager(): Promise<CommunityEventListItem[]> {
    if (this.cache) {
      const cached = await this.cache.getCache<CommunityEventListItem[]>(
        COMMUNITY_EVENTS_MANAGER_CACHE_KEY,
      );
      if (cached) {
        return cached;
      }
    }

    const events = await this.repository.listUpcomingForManager();
    if (this.cache) {
      await this.cache.setCache(
        COMMUNITY_EVENTS_MANAGER_CACHE_KEY,
        events,
        COMMUNITY_EVENTS_CACHE_TTL_SECONDS,
      );
    }
    return events;
  }

  public async create(
    input: CreateCommunityEventData,
  ): Promise<CommunityEventListItem> {
    const created = await this.repository.create(input);
    if (this.cache) {
      await this.cache.deleteCache(COMMUNITY_EVENTS_MANAGER_CACHE_KEY);
    }
    return created;
  }

  public async signUp(
    volunteerId: string,
    communityEventId: string,
  ): Promise<CommunityEventListItem> {
    try {
      const updated = await this.repository.signUp(
        volunteerId,
        communityEventId,
      );
      if (this.cache) {
        await this.cache.deleteCache(COMMUNITY_EVENTS_MANAGER_CACHE_KEY);
      }
      return updated;
    } catch (error) {
      if (!(error instanceof Error)) throw error;

      if (error.message === 'COMMUNITY_EVENT_NOT_FOUND') {
        throw new NotFoundError('Atividade não encontrada.');
      }
      if (error.message === 'COMMUNITY_EVENT_CLOSED') {
        throw new ConflictError('As inscrições para esta atividade estão encerradas.');
      }
      if (error.message === 'COMMUNITY_EVENT_ALREADY_JOINED') {
        throw new ConflictError('Você já está inscrito nesta atividade.');
      }
      if (error.message === 'COMMUNITY_EVENT_FULL') {
        throw new ConflictError('As vagas para esta atividade foram preenchidas.');
      }
      throw error;
    }
  }
}
