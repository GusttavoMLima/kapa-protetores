import type { PrismaClient } from '@prisma/client';
import type {
  AnimalBudgetPredictionItem,
  AnimalStatus,
  Conditions,
  ShelterBudgetPrediction,
  Species,
  TriageStatus,
} from '@kapa/shared';
import {
  evaluateOnnxTreeRow,
  loadOnnxTreeModel,
  type OnnxTreeEnsembleModel,
} from '../ml/onnxTreeRunner';
import type { CacheProvider } from './RedisService';

export const SHELTER_BUDGET_PREDICTION_CACHE_KEY =
  'animals:shelter:budget-prediction';
const SHELTER_BUDGET_PREDICTION_TTL_SECONDS = 60;

export class PredictionService {
  private model: OnnxTreeEnsembleModel | null = null;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: CacheProvider,
    private readonly modelPath?: string,
  ) {}

  private getModel(): OnnxTreeEnsembleModel {
    if (!this.model) {
      this.model = loadOnnxTreeModel(this.modelPath);
    }
    return this.model;
  }

  public mapSpecies(species: Species | string): number {
    return species === 'dog' ? 1 : species === 'cat' ? 2 : 3;
  }

  public mapCondition(condition: Conditions | string): number {
    return condition === 'healthy' ? 1 : condition === 'injured' ? 2 : 3;
  }

  public mapTriage(triage: TriageStatus | string): number {
    return triage === 'no' ? 0 : triage === 'yes' ? 1 : 2;
  }

  public checkDoses(doses: unknown): number {
    return Array.isArray(doses) && doses.length > 0 ? 1 : 0;
  }

  public extractFeatureVector(item: {
    species: Species | string;
    size: number;
    health_condition: Conditions | string;
    castrated: TriageStatus | string;
    vaccinated: boolean;
    dewormed: TriageStatus | string;
    v10_doses: unknown;
    rabies_doses: unknown;
    deworming_doses: unknown;
  }): [number, number, number, number, number, number, number, number, number] {
    return [
      this.mapSpecies(item.species),
      item.size,
      this.mapCondition(item.health_condition),
      this.mapTriage(item.castrated),
      item.vaccinated ? 1 : 0,
      this.mapTriage(item.dewormed),
      this.checkDoses(item.v10_doses),
      this.checkDoses(item.rabies_doses),
      this.checkDoses(item.deworming_doses),
    ];
  }

  public predictAnimalCost(item: {
    species: Species | string;
    size: number;
    health_condition: Conditions | string;
    castrated: TriageStatus | string;
    vaccinated: boolean;
    dewormed: TriageStatus | string;
    v10_doses: unknown;
    rabies_doses: unknown;
    deworming_doses: unknown;
  }): number {
    const model = this.getModel();
    const features = this.extractFeatureVector(item);
    return evaluateOnnxTreeRow(model, features);
  }

  public async predictFutureBudget(): Promise<ShelterBudgetPrediction> {
    if (this.cache) {
      const cached = await this.cache.getCache<ShelterBudgetPrediction>(
        SHELTER_BUDGET_PREDICTION_CACHE_KEY,
      );
      if (cached) {
        return cached;
      }
    }

    const notAdoptedAnimals = await this.prisma.animal.findMany({
      where: {
        NOT: {
          status: 'adopted',
        },
      },
      select: {
        id: true,
        name: true,
        species: true,
        size: true,
        status: true,
        health_condition: true,
        castrated: true,
        vaccinated: true,
        dewormed: true,
        v10_doses: true,
        rabies_doses: true,
        deworming_doses: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const bySpecies: ShelterBudgetPrediction['bySpecies'] = {
      dog: { count: 0, totalCost: 0 },
      cat: { count: 0, totalCost: 0 },
      other: { count: 0, totalCost: 0 },
    };

    const byStatus: ShelterBudgetPrediction['byStatus'] = {
      rescued: { count: 0, totalCost: 0 },
      treating: { count: 0, totalCost: 0 },
      available: { count: 0, totalCost: 0 },
    };

    let rawTotal = 0;

    const animals: AnimalBudgetPredictionItem[] = notAdoptedAnimals.map(
      (item) => {
        const predictedCost = this.predictAnimalCost(item);
        rawTotal += predictedCost;

        const speciesBucket = bySpecies[item.species];
        if (speciesBucket) {
          speciesBucket.count += 1;
          speciesBucket.totalCost =
            Math.round((speciesBucket.totalCost + predictedCost) * 100) / 100;
        }

        if (item.status !== 'adopted') {
          const statusKey = item.status as Exclude<AnimalStatus, 'adopted'>;
          const statusBucket = byStatus[statusKey];
          if (statusBucket) {
            statusBucket.count += 1;
            statusBucket.totalCost =
              Math.round((statusBucket.totalCost + predictedCost) * 100) / 100;
          }
        }

        return {
          id: item.id,
          name: item.name,
          species: item.species,
          size: item.size,
          status: item.status,
          healthCondition: item.health_condition,
          predictedCost,
        };
      },
    );

    const totalPredictedBudget = Math.round(rawTotal * 100) / 100;
    const activeAnimalsCount = animals.length;
    const averageCostPerAnimal =
      activeAnimalsCount > 0
        ? Math.round((totalPredictedBudget / activeAnimalsCount) * 100) / 100
        : 0;

    const result: ShelterBudgetPrediction = {
      totalPredictedBudget,
      activeAnimalsCount,
      averageCostPerAnimal,
      bySpecies,
      byStatus,
      animals,
    };

    if (this.cache) {
      await this.cache.setCache(
        SHELTER_BUDGET_PREDICTION_CACHE_KEY,
        result,
        SHELTER_BUDGET_PREDICTION_TTL_SECONDS,
      );
    }

    return result;
  }
}
