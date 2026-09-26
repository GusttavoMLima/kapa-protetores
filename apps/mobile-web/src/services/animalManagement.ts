import type { AnimalManagementQuery, UpdateAnimalInput } from '@kapa/shared';
import { apiRequest } from './api';
import { managedAnimalSchema, managementPageSchema } from '../screens/animalManagement/model';

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
