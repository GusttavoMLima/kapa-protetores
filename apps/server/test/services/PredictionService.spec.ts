import type { PrismaClient } from '@prisma/client';
import { PredictionService } from '../../src/services/PredictionService';

describe('PredictionService (ONNX TreeEnsembleRegressor)', () => {
  it('loads adopet_tree_model.onnx and predicts future shelter budget accurately', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'clxyz1111111111abcdefghij',
        name: 'Thor',
        species: 'dog',
        size: 2,
        status: 'available',
        health_condition: 'healthy',
        castrated: 'yes',
        vaccinated: true,
        dewormed: 'yes',
        v10_doses: [{ status: 'sim', data: '10/10/2026' }],
        rabies_doses: [{ status: 'sim', data: '10/10/2026' }],
        deworming_doses: [{ status: 'sim', data: '10/10/2026' }],
      },
      {
        id: 'clxyz2222222222abcdefghij',
        name: 'Rex',
        species: 'dog',
        size: 3,
        status: 'treating',
        health_condition: 'injured',
        castrated: 'no',
        vaccinated: false,
        dewormed: 'no',
        v10_doses: [],
        rabies_doses: [],
        deworming_doses: [],
      },
      {
        id: 'clxyz3333333333abcdefghij',
        name: 'Mia',
        species: 'cat',
        size: 1,
        status: 'rescued',
        health_condition: 'healthy',
        castrated: 'yes',
        vaccinated: true,
        dewormed: 'yes',
        v10_doses: [{ status: 'sim' }],
        rabies_doses: [{ status: 'sim' }],
        deworming_doses: [{ status: 'sim' }],
      },
    ]);

    const getCache = jest.fn().mockResolvedValue(null);
    const setCache = jest.fn().mockResolvedValue(undefined);
    const deleteCache = jest.fn().mockResolvedValue(undefined);

    const prisma = {
      animal: { findMany },
    } as unknown as PrismaClient;

    const service = new PredictionService(prisma, {
      getCache,
      setCache,
      deleteCache,
    });

    const result = await service.predictFutureBudget();

    expect(result.activeAnimalsCount).toBe(3);
    expect(result.animals).toHaveLength(3);
    expect(result.animals[0].predictedCost).toBeCloseTo(395.26, 2);
    expect(result.animals[1].predictedCost).toBeCloseTo(690.32, 2);
    expect(result.animals[2].predictedCost).toBeCloseTo(220.0, 2);
    expect(result.totalPredictedBudget).toBeCloseTo(1305.58, 2);
    expect(result.bySpecies.dog.count).toBe(2);
    expect(result.bySpecies.cat.count).toBe(1);
    expect(result.byStatus.treating.count).toBe(1);
    expect(setCache).toHaveBeenCalledTimes(1);
  });

  it('returns cached prediction when Redis cache hits', async () => {
    const findMany = jest.fn();
    const cachedPrediction = {
      totalPredictedBudget: 500,
      activeAnimalsCount: 2,
      averageCostPerAnimal: 250,
      bySpecies: {
        dog: { count: 1, totalCost: 300 },
        cat: { count: 1, totalCost: 200 },
        other: { count: 0, totalCost: 0 },
      },
      byStatus: {
        rescued: { count: 0, totalCost: 0 },
        treating: { count: 0, totalCost: 0 },
        available: { count: 2, totalCost: 500 },
      },
      animals: [],
    };
    const getCache = jest.fn().mockResolvedValue(cachedPrediction);

    const prisma = {
      animal: { findMany },
    } as unknown as PrismaClient;

    const service = new PredictionService(prisma, {
      getCache,
      setCache: jest.fn(),
      deleteCache: jest.fn(),
    });

    const result = await service.predictFutureBudget();

    expect(result).toEqual(cachedPrediction);
    expect(findMany).not.toHaveBeenCalled();
  });
});
