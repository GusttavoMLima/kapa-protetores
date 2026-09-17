import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Animal, LegacyAnimal } from '../types/animal';

const KEY = '@kapa/animals';

export type StoredAnimal = Animal | LegacyAnimal;

export async function listAnimals(): Promise<StoredAnimal[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  return JSON.parse(raw) as StoredAnimal[];
}

export async function saveAnimal(animal: StoredAnimal): Promise<void> {
  const animals = await listAnimals();
  animals.unshift(animal);
  await AsyncStorage.setItem(KEY, JSON.stringify(animals));
}

