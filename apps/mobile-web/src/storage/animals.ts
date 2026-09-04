import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Animal } from '../types/animal';

const KEY = '@kapa/animals';

export async function listAnimals(): Promise<Animal[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  return JSON.parse(raw) as Animal[];
}

export async function saveAnimal(animal: Animal): Promise<void> {
  const animals = await listAnimals();
  animals.unshift(animal);
  await AsyncStorage.setItem(KEY, JSON.stringify(animals));
}
