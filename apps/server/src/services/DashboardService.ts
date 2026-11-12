import type { PrismaClient } from '@prisma/client';
import type {
  AdoptionStatus,
  AnimalStatus,
  Conditions,
  ShelterDashboardSummary,
  Species,
  SystemEventTypes,
  UserRole,
} from '@kapa/shared';
import type { PredictionService } from './PredictionService';
import type { CacheProvider } from './RedisService';

export const SHELTER_DASHBOARD_CACHE_KEY = 'dashboard:shelter:summary';
const SHELTER_DASHBOARD_TTL_SECONDS = 60;
const RECENT_EVENTS_LIMIT = 8;

export class DashboardService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly predictionService: PredictionService,
    private readonly cache?: CacheProvider,
  ) {}

  public async getSummary(): Promise<ShelterDashboardSummary> {
    if (this.cache) {
      const cached = await this.cache.getCache<ShelterDashboardSummary>(
        SHELTER_DASHBOARD_CACHE_KEY,
      );
      if (cached && cached.budgetPrediction?.byCategory) {
        return cached;
      }
    }

    const now = new Date();

    const [
      animalRows,
      adoptionGroups,
      volunteerGroups,
      userRows,
      upcomingEvents,
      totalFavoritesCount,
      recentEventsRows,
      budgetPrediction,
    ] = await Promise.all([
      this.prisma.animal.findMany({
        select: {
          status: true,
          species: true,
          health_condition: true,
          vaccinated: true,
          castrated: true,
        },
      }),
      this.prisma.adoptions.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.volunteerApplications.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.user.findMany({
        select: {
          role: true,
          deactivated_at: true,
        },
      }),
      this.prisma.communityEvents.findMany({
        where: {
          start_at: { gte: now },
        },
        select: {
          vacancies: true,
          _count: {
            select: { volunteers: true },
          },
        },
      }),
      this.prisma.favorites.count(),
      this.prisma.events.findMany({
        orderBy: { emitted_at: 'desc' },
        take: RECENT_EVENTS_LIMIT,
        select: {
          id: true,
          type: true,
          emitted_at: true,
          user: {
            select: { username: true },
          },
          animal: {
            select: { name: true },
          },
        },
      }),
      this.predictionService.predictFutureBudget(),
    ]);

    const animalByStatus: Record<AnimalStatus, number> = {
      rescued: 0,
      treating: 0,
      available: 0,
      adopted: 0,
    };
    const animalBySpecies: Record<Species, number> = {
      dog: 0,
      cat: 0,
      other: 0,
    };
    const activeByCondition: Record<Conditions, number> = {
      healthy: 0,
      injured: 0,
      debilitated: 0,
    };
    let activeInShelter = 0;
    let activeVaccinatedCount = 0;
    let activeCastratedCount = 0;

    for (const animal of animalRows) {
      animalByStatus[animal.status] =
        (animalByStatus[animal.status] ?? 0) + 1;
      animalBySpecies[animal.species] =
        (animalBySpecies[animal.species] ?? 0) + 1;

      if (animal.status !== 'adopted') {
        activeInShelter += 1;
        activeByCondition[animal.health_condition] =
          (activeByCondition[animal.health_condition] ?? 0) + 1;
        if (animal.vaccinated) {
          activeVaccinatedCount += 1;
        }
        if (animal.castrated === 'yes') {
          activeCastratedCount += 1;
        }
      }
    }

    const adoptionByStatus: Record<AdoptionStatus, number> = {
      pending: 0,
      interviewing: 0,
      approved: 0,
      rejected: 0,
      canceled: 0,
    };
    let adoptionTotal = 0;
    for (const group of adoptionGroups) {
      const count = group._count._all;
      adoptionByStatus[group.status] = count;
      adoptionTotal += count;
    }
    const approvalRatePercent =
      adoptionTotal > 0
        ? Math.round((adoptionByStatus.approved / adoptionTotal) * 100)
        : 0;

    let pendingApplicationsCount = 0;
    let approvedApplicationsCount = 0;
    let rejectedApplicationsCount = 0;
    for (const group of volunteerGroups) {
      if (group.status === 'pending') {
        pendingApplicationsCount = group._count._all;
      } else if (group.status === 'approved') {
        approvedApplicationsCount = group._count._all;
      } else if (group.status === 'rejected') {
        rejectedApplicationsCount = group._count._all;
      }
    }

    let upcomingVolunteerSignupsCount = 0;
    let upcomingTotalVacancies = 0;
    for (const event of upcomingEvents) {
      upcomingVolunteerSignupsCount += event._count.volunteers;
      upcomingTotalVacancies += event.vacancies ?? 0;
    }

    const usersByRole: Record<UserRole, number> = {
      adopter: 0,
      volunteer: 0,
      protector: 0,
      admin: 0,
    };
    let totalActiveUsers = 0;
    let deactivatedCount = 0;
    for (const user of userRows) {
      if (user.deactivated_at) {
        deactivatedCount += 1;
      } else {
        totalActiveUsers += 1;
        usersByRole[user.role] = (usersByRole[user.role] ?? 0) + 1;
      }
    }

    const summary: ShelterDashboardSummary = {
      generatedAt: now.toISOString(),
      animals: {
        total: animalRows.length,
        activeInShelter,
        byStatus: animalByStatus,
        bySpecies: animalBySpecies,
        activeByCondition,
        activeVaccinatedCount,
        activeCastratedCount,
        totalFavoritesCount,
      },
      adoptions: {
        total: adoptionTotal,
        byStatus: adoptionByStatus,
        approvalRatePercent,
      },
      volunteers: {
        pendingApplicationsCount,
        approvedApplicationsCount,
        rejectedApplicationsCount,
        upcomingEventsCount: upcomingEvents.length,
        upcomingVolunteerSignupsCount,
        upcomingTotalVacancies,
      },
      users: {
        totalActive: totalActiveUsers,
        deactivatedCount,
        byRole: usersByRole,
      },
      budgetPrediction,
      recentEvents: recentEventsRows.map((row) => ({
        id: row.id,
        type: row.type as SystemEventTypes,
        emittedAt: row.emitted_at.toISOString(),
        userName: row.user?.username ?? null,
        animalName: row.animal?.name ?? null,
      })),
    };

    if (this.cache) {
      await this.cache.setCache(
        SHELTER_DASHBOARD_CACHE_KEY,
        summary,
        SHELTER_DASHBOARD_TTL_SECONDS,
      );
    }

    return summary;
  }
}
