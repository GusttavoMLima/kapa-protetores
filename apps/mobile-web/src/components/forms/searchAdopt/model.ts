import { z } from 'zod';
import type { Animal } from '@kapa/shared';

export type SearchAdoptSpecies = 'all' | 'dog' | 'cat';
export type SearchAdoptGender = 'all' | 'male' | 'female';
export type SearchAdoptSize = 'all' | 'small' | 'medium' | 'large';

export const searchAdoptSpeciesOptions: { value: SearchAdoptSpecies; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'dog', label: 'Cachorros' },
  { value: 'cat', label: 'Gatos' },
];

export const searchAdoptGenderOptions: { value: SearchAdoptGender; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'male', label: 'Machos' },
  { value: 'female', label: 'Fêmeas' },
];

export const searchAdoptSizeOptions: { value: SearchAdoptSize; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'small', label: 'Pequeno' },
  { value: 'medium', label: 'Médio' },
  { value: 'large', label: 'Grande' },
];

export const searchAdoptSchema = z.object({
  breed: z.string().default(''),
  specie: z.enum(['all', 'dog', 'cat']).default('all'),
  gender: z.enum(['all', 'male', 'female']).default('all'),
  size: z.enum(['all', 'small', 'medium', 'large']).default('all'),
});

export type SearchAdoptFilters = z.infer<typeof searchAdoptSchema>;

export const defaultSearchAdoptFilters: SearchAdoptFilters = {
  breed: '',
  specie: 'all',
  gender: 'all',
  size: 'all',
};

export function matchesSearchAdoptFilters(
  animal: Animal,
  filters: SearchAdoptFilters,
): boolean {
  const query = filters.breed.trim().toLowerCase();
  if (query) {
    const matchesName = animal.name.toLowerCase().includes(query);
    const matchesBreed = (animal.breed ?? '').toLowerCase().includes(query);
    if (!matchesName && !matchesBreed) {
      return false;
    }
  }

  if (filters.specie !== 'all') {
    if (animal.species !== filters.specie) {
      return false;
    }
  }

  if (filters.gender !== 'all') {
    if (animal.gender !== filters.gender) {
      return false;
    }
  }

  if (filters.size !== 'all') {
    if (filters.size === 'small' && animal.size > 2) {
      return false;
    }
    if (filters.size === 'medium' && animal.size !== 3) {
      return false;
    }
    if (filters.size === 'large' && animal.size < 4) {
      return false;
    }
  }

  return true;
}
