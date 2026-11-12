import type { PrismaClient } from '@prisma/client';
import { SystemEventTypes, type ShelterBudgetPrediction } from '@kapa/shared';
import { DashboardService } from '../../src/services/DashboardService';
import type { PredictionService } from '../../src/services/PredictionService';

const sampleBudgetPrediction: ShelterBudgetPrediction = {
  totalPredictedBudget: 1305.58,
  activeAnimalsCount: 3,
  averageCostPerAnimal: 435.19,
  byCategory: {
    nutrition: 620.0,
    veterinary: 250.32,
    preventives: 180.0,
    hygiene: 255.26,
  },
  bySpecies: {
    dog: {
      count: 2,
      totalCost: 1085.58,
      averageCost: 542.79,
      breakdown: {
        nutrition: 461.6,
        veterinary: 250.32,
        preventives: 180.0,
        hygiene: 193.66,
      },
    },
    cat: {
      count: 1,
      totalCost: 220.0,
      averageCost: 220.0,
      breakdown: {
        nutrition: 158.4,
        veterinary: 0,
        preventives: 0,
        hygiene: 61.6,
      },
    },
    other: {
      count: 0,
      totalCost: 0,
      averageCost: 0,
      breakdown: {
        nutrition: 0,
        veterinary: 0,
        preventives: 0,
        hygiene: 0,
      },
    },
  },
  bySize: {
    small: {
      count: 1,
      totalCost: 220.0,
      averageCost: 220.0,
      breakdown: {
        nutrition: 158.4,
        veterinary: 0,
        preventives: 0,
        hygiene: 61.6,
      },
    },
    medium: {
      count: 1,
      totalCost: 395.26,
      averageCost: 395.26,
      breakdown: {
        nutrition: 284.59,
        veterinary: 0,
        preventives: 0,
        hygiene: 110.67,
      },
    },
    large: {
      count: 1,
      totalCost: 690.32,
      averageCost: 690.32,
      breakdown: {
        nutrition: 177.01,
        veterinary: 250.32,
        preventives: 180.0,
        hygiene: 82.99,
      },
    },
  },
  byStatus: {
    rescued: {
      count: 1,
      totalCost: 220.0,
      averageCost: 220.0,
      breakdown: {
        nutrition: 158.4,
        veterinary: 0,
        preventives: 0,
        hygiene: 61.6,
      },
    },
    treating: {
      count: 1,
      totalCost: 690.32,
      averageCost: 690.32,
      breakdown: {
        nutrition: 177.01,
        veterinary: 250.32,
        preventives: 180.0,
        hygiene: 82.99,
      },
    },
    available: {
      count: 1,
      totalCost: 395.26,
      averageCost: 395.26,
      breakdown: {
        nutrition: 284.59,
        veterinary: 0,
        preventives: 0,
        hygiene: 110.67,
      },
    },
  },
  animals: [],
};

describe('DashboardService', () => {
  it('aggregates shelter metrics, funnel counts, and ONNX budget breakdown', async () => {
    const prisma = {
      animal: {
        findMany: jest.fn().mockResolvedValue([
          {
            status: 'available',
            species: 'dog',
            health_condition: 'healthy',
            vaccinated: true,
            castrated: 'yes',
          },
          {
            status: 'treating',
            species: 'dog',
            health_condition: 'injured',
            vaccinated: false,
            castrated: 'no',
          },
          {
            status: 'rescued',
            species: 'cat',
            health_condition: 'healthy',
            vaccinated: true,
            castrated: 'yes',
          },
          {
            status: 'adopted',
            species: 'cat',
            health_condition: 'healthy',
            vaccinated: true,
            castrated: 'yes',
          },
        ]),
      },
      adoptions: {
        groupBy: jest.fn().mockResolvedValue([
          { status: 'pending', _count: { _all: 2 } },
          { status: 'interviewing', _count: { _all: 1 } },
          { status: 'approved', _count: { _all: 3 } },
        ]),
      },
      volunteerApplications: {
        groupBy: jest.fn().mockResolvedValue([
          { status: 'pending', _count: { _all: 4 } },
          { status: 'approved', _count: { _all: 7 } },
        ]),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([
          { role: 'adopter', deactivated_at: null },
          { role: 'volunteer', deactivated_at: null },
          { role: 'protector', deactivated_at: null },
          { role: 'admin', deactivated_at: null },
          { role: 'adopter', deactivated_at: new Date('2026-11-10T00:00:00Z') },
        ]),
      },
      communityEvents: {
        findMany: jest.fn().mockResolvedValue([
          { vacancies: 10, _count: { volunteers: 6 } },
          { vacancies: 5, _count: { volunteers: 4 } },
        ]),
      },
      favorites: {
        count: jest.fn().mockResolvedValue(18),
      },
      events: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'evt-1',
            type: SystemEventTypes.ADOPTION_REQUESTED,
            emitted_at: new Date('2026-11-11T10:00:00.000Z'),
            user: { username: 'Ana' },
            animal: { name: 'Thor' },
          },
        ]),
      },
    } as unknown as PrismaClient;

    const predictionService = {
      predictFutureBudget: jest.fn().mockResolvedValue(sampleBudgetPrediction),
    } as unknown as PredictionService;

    const getCache = jest.fn().mockResolvedValue(null);
    const setCache = jest.fn().mockResolvedValue(undefined);
    const deleteCache = jest.fn().mockResolvedValue(undefined);

    const service = new DashboardService(prisma, predictionService, {
      getCache,
      setCache,
      deleteCache,
    });

    const summary = await service.getSummary();

    expect(summary.animals.total).toBe(4);
    expect(summary.animals.activeInShelter).toBe(3);
    expect(summary.animals.activeVaccinatedCount).toBe(2);
    expect(summary.animals.activeCastratedCount).toBe(2);
    expect(summary.animals.totalFavoritesCount).toBe(18);
    expect(summary.adoptions.total).toBe(6);
    expect(summary.adoptions.approvalRatePercent).toBe(50);
    expect(summary.volunteers.pendingApplicationsCount).toBe(4);
    expect(summary.volunteers.upcomingVolunteerSignupsCount).toBe(10);
    expect(summary.volunteers.upcomingTotalVacancies).toBe(15);
    expect(summary.users.totalActive).toBe(4);
    expect(summary.users.deactivatedCount).toBe(1);
    expect(summary.budgetPrediction.byCategory.nutrition).toBe(620.0);
    expect(summary.recentEvents).toHaveLength(1);
    expect(setCache).toHaveBeenCalledTimes(1);
  });
});
