import {
  SystemEventTypes,
  type VolunteerApplication,
  type VolunteerApplicationData,
  type VolunteerApplicationStatus,
} from '@kapa/shared';
import { ConflictError, NotFoundError } from '../errors';
import { VolunteerApplicationRepository } from '../repositories/VolunteerApplicationRepository';
import type { EventsService } from './EventsService';
import type { CacheProvider } from './RedisService';
import {
  buildUserCountsCacheKey,
  buildUserProfileCacheKey,
} from './UserService';

const VOLUNTEER_APPLICATIONS_CACHE_TTL_SECONDS = 60;
const ADMIN_VOLUNTEER_APPLICATIONS_CACHE_KEY =
  'volunteer-applications:admin:all';

export function buildUserVolunteerApplicationCacheKey(userId: string): string {
  return `volunteer-applications:user:${userId}`;
}

export class VolunteerApplicationService {
  constructor(
    private readonly repository: VolunteerApplicationRepository,
    private readonly cache?: CacheProvider,
    private readonly eventsService?: EventsService,
  ) {}

  public async submitApplication(
    userId: string,
    data: VolunteerApplicationData,
  ): Promise<VolunteerApplication> {
    try {
      const created = await this.repository.create(userId, data);

      if (this.eventsService) {
        await this.eventsService.createEvent({
          type: SystemEventTypes.VOLUNTEER_APPLICATION_SUBMITTED,
          userId,
          payload: {
            applicationId: created.id,
          },
        });
      }

      if (this.cache) {
        await Promise.all([
          this.cache.deleteCache(
            buildUserVolunteerApplicationCacheKey(userId),
          ),
          this.cache.deleteCache(ADMIN_VOLUNTEER_APPLICATIONS_CACHE_KEY),
          this.cache.deleteCache(buildUserProfileCacheKey(userId)),
          this.cache.deleteCache(buildUserCountsCacheKey(userId)),
        ]);
      }

      return created;
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (error.message === 'USER_NOT_FOUND') {
        throw new NotFoundError('Usuário não encontrado.');
      }
      if (error.message === 'VOLUNTEER_ROLE_ALREADY_GRANTED') {
        throw new ConflictError(
          'Sua conta já possui acesso de voluntariado ou gestão.',
        );
      }
      if (error.message === 'VOLUNTEER_APPLICATION_ALREADY_PENDING') {
        throw new ConflictError(
          'Você já possui uma solicitação de voluntariado em análise.',
        );
      }
      throw error;
    }
  }

  public async getMyApplication(
    userId: string,
  ): Promise<VolunteerApplication | null> {
    const cacheKey = buildUserVolunteerApplicationCacheKey(userId);
    if (this.cache) {
      const cached =
        await this.cache.getCache<VolunteerApplication | null>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    const application = await this.repository.findLatestByUserId(userId);
    if (this.cache && application) {
      await this.cache.setCache(
        cacheKey,
        application,
        VOLUNTEER_APPLICATIONS_CACHE_TTL_SECONDS,
      );
    }
    return application;
  }

  public async listForAdmin(): Promise<VolunteerApplication[]> {
    if (this.cache) {
      const cached = await this.cache.getCache<VolunteerApplication[]>(
        ADMIN_VOLUNTEER_APPLICATIONS_CACHE_KEY,
      );
      if (cached) {
        return cached;
      }
    }

    const applications = await this.repository.listForAdmin();
    if (this.cache) {
      await this.cache.setCache(
        ADMIN_VOLUNTEER_APPLICATIONS_CACHE_KEY,
        applications,
        VOLUNTEER_APPLICATIONS_CACHE_TTL_SECONDS,
      );
    }
    return applications;
  }

  public async updateStatus(
    applicationId: string,
    status: Exclude<VolunteerApplicationStatus, 'pending'>,
    reviewerId: string,
  ): Promise<VolunteerApplication> {
    try {
      const updated = await this.repository.updateStatus(
        applicationId,
        status,
      );

      if (this.eventsService) {
        if (status === 'approved') {
          await this.eventsService.createEvent({
            type: SystemEventTypes.VOLUNTEER_APPLICATION_APPROVED,
            userId: updated.userId,
            payload: {
              applicationId: updated.id,
              approvedByUserId: reviewerId,
            },
          });
        } else {
          await this.eventsService.createEvent({
            type: SystemEventTypes.VOLUNTEER_APPLICATION_REJECTED,
            userId: updated.userId,
            payload: {
              applicationId: updated.id,
              rejectedByUserId: reviewerId,
            },
          });
        }
      }

      if (this.cache) {
        await Promise.all([
          this.cache.deleteCache(ADMIN_VOLUNTEER_APPLICATIONS_CACHE_KEY),
          this.cache.deleteCache(
            buildUserVolunteerApplicationCacheKey(updated.userId),
          ),
          this.cache.deleteCache(buildUserProfileCacheKey(updated.userId)),
          this.cache.deleteCache(buildUserCountsCacheKey(updated.userId)),
        ]);
      }

      return updated;
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (error.message === 'VOLUNTEER_APPLICATION_NOT_FOUND') {
        throw new NotFoundError('Solicitação de voluntariado não encontrada.');
      }
      throw error;
    }
  }
}
