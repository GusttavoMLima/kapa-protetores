import type {
  AnimalManagementQuery,
  ShelterBudgetPrediction,
  UpdateAnimalInput,
} from '@kapa/shared';
import { apiRequest } from './api';
import { z } from 'zod';
import { managedAnimalSchema, managementPageSchema } from '../screens/animalManagement/model';

const costBreakdownSchema = z.object({
  nutrition: z.number().finite(),
  veterinary: z.number().finite(),
  preventives: z.number().finite(),
  hygiene: z.number().finite(),
});

const emptyCostBreakdown = {
  nutrition: 0,
  veterinary: 0,
  preventives: 0,
  hygiene: 0,
};

const budgetCategorySchema = z.object({
  count: z.number().int().nonnegative(),
  totalCost: z.number().finite(),
  averageCost: z.number().finite().default(0),
  breakdown: costBreakdownSchema.default(emptyCostBreakdown),
});

const emptyCategorySummary = {
  count: 0,
  totalCost: 0,
  averageCost: 0,
  breakdown: emptyCostBreakdown,
};

const budgetPredictionSchema = z.object({
  totalPredictedBudget: z.number().finite(),
  activeAnimalsCount: z.number().int().nonnegative(),
  averageCostPerAnimal: z.number().finite(),
  byCategory: costBreakdownSchema.default(emptyCostBreakdown),
  bySpecies: z.object({
    dog: budgetCategorySchema,
    cat: budgetCategorySchema,
    other: budgetCategorySchema,
  }),
  bySize: z
    .object({
      small: budgetCategorySchema,
      medium: budgetCategorySchema,
      large: budgetCategorySchema,
    })
    .default({
      small: emptyCategorySummary,
      medium: emptyCategorySummary,
      large: emptyCategorySummary,
    }),
  byStatus: z.object({
    rescued: budgetCategorySchema,
    treating: budgetCategorySchema,
    available: budgetCategorySchema,
  }),
  animals: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      species: z.enum(['dog', 'cat', 'other']),
      size: z.number(),
      status: z.enum(['rescued', 'treating', 'available', 'adopted']),
      healthCondition: z.enum(['healthy', 'injured', 'debilitated']),
      predictedCost: z.number().finite(),
      breakdown: costBreakdownSchema.default(emptyCostBreakdown),
    }),
  ),
});

export async function fetchShelterBudgetPrediction(signal?: AbortSignal): Promise<ShelterBudgetPrediction> {
  const result = await apiRequest<unknown>(
    '/animals/management/budget-prediction',
    { signal },
  );
  return budgetPredictionSchema.parse(result);
}

export async function fetchManagedAnimals(query: AnimalManagementQuery, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize), sort: query.sort });
  if (query.search) params.set('search', query.search);
  if (query.species) params.set('species', query.species);
  if (query.status) params.set('status', query.status);
  return managementPageSchema.parse(await apiRequest<unknown>(`/animals/management?${params}`, { signal }));
}

export async function fetchManagedAnimal(id: string, signal?: AbortSignal) {
  return managedAnimalSchema.parse(await apiRequest<unknown>(`/animals/management/${encodeURIComponent(id)}`, { signal }));
}

export async function updateManagedAnimal(id: string, input: UpdateAnimalInput) {
  return managedAnimalSchema.parse(await apiRequest<unknown>(`/animals/management/${encodeURIComponent(id)}`, {
    method: 'PATCH', body: JSON.stringify(input),
  }));
}
