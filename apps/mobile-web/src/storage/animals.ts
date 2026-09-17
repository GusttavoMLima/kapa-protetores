import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Animal, LegacyAnimal } from '../types/animal';

const KEY = '@kapa/animals';

export type StoredAnimal = Animal | LegacyAnimal;

export async function listAnimals(): Promise<StoredAnimal[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is StoredAnimal => {
      if (!item || typeof item !== 'object') return false;
      const candidate = item as Record<string, unknown>;
      return (
        typeof candidate.id === 'string' &&
        typeof candidate.createdAt === 'string'
      );
    });
  } catch {
    return [];
  }
}

export async function saveAnimal(animal: StoredAnimal): Promise<void> {
  const animals = await listAnimals();
  animals.unshift(animal);
  await AsyncStorage.setItem(KEY, JSON.stringify(animals));
}

