import type { PrismaClient } from '@prisma/client';
import type {
  AnimalBudgetPredictionItem,
  AnimalCostBreakdown,
  AnimalStatus,
  Conditions,
  ShelterBudgetCategorySummary,
  ShelterBudgetPrediction,
  ShelterBudgetSizeKey,
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
const NUTRITION_BASELINE_SHARE = 0.72;

export interface PredictionAnimalInput {
  species: Species | string;
  size: number;
  health_condition: Conditions | string;
  castrated: TriageStatus | string;
  vaccinated: boolean;
  dewormed: TriageStatus | string;
  v10_doses: unknown;
  rabies_doses: unknown;
  deworming_doses: unknown;
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function createEmptyCostBreakdown(): AnimalCostBreakdown {
  return {
    nutrition: 0,
    veterinary: 0,
    preventives: 0,
    hygiene: 0,
  };
}

function createEmptyCategorySummary(): ShelterBudgetCategorySummary {
  return {
    count: 0,
    totalCost: 0,
    averageCost: 0,
    breakdown: createEmptyCostBreakdown(),
  };
}

function accumulateCategorySummary(
  bucket: ShelterBudgetCategorySummary,
  predictedCost: number,
  breakdown: AnimalCostBreakdown,
): void {
  bucket.count += 1;
  bucket.totalCost = roundCents(bucket.totalCost + predictedCost);
  bucket.averageCost = roundCents(bucket.totalCost / bucket.count);
  bucket.breakdown.nutrition = roundCents(
    bucket.breakdown.nutrition + breakdown.nutrition,
  );
  bucket.breakdown.veterinary = roundCents(
    bucket.breakdown.veterinary + breakdown.veterinary,
  );
  bucket.breakdown.preventives = roundCents(
    bucket.breakdown.preventives + breakdown.preventives,
  );
  bucket.breakdown.hygiene = roundCents(
    bucket.breakdown.hygiene + breakdown.hygiene,
  );
}

export function mapSizeToKey(size: number): ShelterBudgetSizeKey {
  if (size <= 1) return 'small';
  if (size === 2) return 'medium';
  return 'large';
}

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

  public extractFeatureVector(
    item: PredictionAnimalInput,
  ): [number, number, number, number, number, number, number, number, number] {
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

  public predictAnimalCost(item: PredictionAnimalInput): number {
    const model = this.getModel();
    const features = this.extractFeatureVector(item);
    return evaluateOnnxTreeRow(model, features);
  }

  public predictAnimalCostWithBreakdown(item: PredictionAnimalInput): {
    predictedCost: number;
    breakdown: AnimalCostBreakdown;
  } {
    const predictedCost = this.predictAnimalCost(item);

    const healthyCost = this.predictAnimalCost({
      ...item,
      health_condition: 'healthy',
    });

    const immunizedBaselineCost = this.predictAnimalCost({
      species: item.species,
      size: item.size,
      health_condition: 'healthy',
      castrated: 'yes',
      vaccinated: true,
      dewormed: 'yes',
      v10_doses: [{ status: 'sim' }],
      rabies_doses: [{ status: 'sim' }],
      deworming_doses: [{ status: 'sim' }],
    });

    const veterinary = Math.max(0, roundCents(predictedCost - healthyCost));
    const remainingAfterVet = Math.max(
      0,
      roundCents(predictedCost - veterinary),
    );
    const preventives = Math.min(
      remainingAfterVet,
      Math.max(0, roundCents(healthyCost - immunizedBaselineCost)),
    );
    const recurringMaintenance = Math.max(
      0,
      roundCents(remainingAfterVet - preventives),
    );
    const nutrition = roundCents(
      recurringMaintenance * NUTRITION_BASELINE_SHARE,
    );
    const hygiene = Math.max(
      0,
      roundCents(recurringMaintenance - nutrition),
    );

    return {
      predictedCost,
      breakdown: {
        nutrition,
        veterinary,
        preventives,
        hygiene,
      },
    };
  }

  public async predictFutureBudget(): Promise<ShelterBudgetPrediction> {
    if (this.cache) {
      const cached = await this.cache.getCache<ShelterBudgetPrediction>(
        SHELTER_BUDGET_PREDICTION_CACHE_KEY,
      );
      if (cached && cached.byCategory && cached.bySize) {
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

    const byCategory = createEmptyCostBreakdown();

    const bySpecies: ShelterBudgetPrediction['bySpecies'] = {
      dog: createEmptyCategorySummary(),
      cat: createEmptyCategorySummary(),
      other: createEmptyCategorySummary(),
    };

    const bySize: ShelterBudgetPrediction['bySize'] = {
      small: createEmptyCategorySummary(),
      medium: createEmptyCategorySummary(),
      large: createEmptyCategorySummary(),
    };

    const byStatus: ShelterBudgetPrediction['byStatus'] = {
      rescued: createEmptyCategorySummary(),
      treating: createEmptyCategorySummary(),
      available: createEmptyCategorySummary(),
    };

    let rawTotal = 0;

    const animals: AnimalBudgetPredictionItem[] = notAdoptedAnimals.map(
      (item) => {
        const { predictedCost, breakdown } =
          this.predictAnimalCostWithBreakdown(item);
        rawTotal += predictedCost;

        byCategory.nutrition = roundCents(
          byCategory.nutrition + breakdown.nutrition,
        );
        byCategory.veterinary = roundCents(
          byCategory.veterinary + breakdown.veterinary,
        );
        byCategory.preventives = roundCents(
          byCategory.preventives + breakdown.preventives,
        );
        byCategory.hygiene = roundCents(byCategory.hygiene + breakdown.hygiene);

        const speciesBucket = bySpecies[item.species];
        if (speciesBucket) {
          accumulateCategorySummary(speciesBucket, predictedCost, breakdown);
        }

        const sizeKey = mapSizeToKey(item.size);
        accumulateCategorySummary(bySize[sizeKey], predictedCost, breakdown);

        if (item.status !== 'adopted') {
          const statusKey = item.status as Exclude<AnimalStatus, 'adopted'>;
          const statusBucket = byStatus[statusKey];
          if (statusBucket) {
            accumulateCategorySummary(statusBucket, predictedCost, breakdown);
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
          breakdown,
        };
      },
    );

    const totalPredictedBudget = roundCents(rawTotal);
    const activeAnimalsCount = animals.length;
    const averageCostPerAnimal =
      activeAnimalsCount > 0
        ? roundCents(totalPredictedBudget / activeAnimalsCount)
        : 0;

    const result: ShelterBudgetPrediction = {
      totalPredictedBudget,
      activeAnimalsCount,
      averageCostPerAnimal,
      byCategory,
      bySpecies,
      bySize,
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
