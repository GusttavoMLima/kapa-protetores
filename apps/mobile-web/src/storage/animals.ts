import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Animal, LegacyAnimal } from '../types/animal';
import type { CreateAnimalInput } from '@kapa/shared';
import { apiRequest } from '@/services/api';

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

export async function saveAnimal(animal: StoredAnimal): Promise<Animal> {
  if (!('nome' in animal)) {
    return apiRequest<Animal>('/animals', { method: 'POST', body: JSON.stringify(animal) });
  }
  return apiRequest<Animal>('/animals', {
    method: 'POST',
    body: JSON.stringify(toCreateAnimalInput(animal)),
  });
}

export async function uploadAnimalPhoto(animalId: string, uri: string): Promise<void> {
  const form = new FormData();
  if (typeof window !== 'undefined') {
    const blob = await fetch(uri).then((response) => response.blob());
    form.append('photo', blob, `animal.${extensionForMime(blob.type)}`);
  } else {
    const extension = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const type = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
    form.append('photo', { uri, name: `animal.${extensionForMime(type)}`, type } as unknown as Blob);
  }
  await apiRequest(`/animals/${encodeURIComponent(animalId)}/photos`, { method: 'POST', body: form });
}

function extensionForMime(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

function toCreateAnimalInput(animal: LegacyAnimal): CreateAnimalInput {
  const triState = (value: 'sim' | 'nao' | 'nao_sei') =>
    value === 'sim' ? 'yes' as const : value === 'nao' ? 'no' as const : 'unknown' as const;
  const dateParts = animal.dataResgate.split('/');
  const rescuedAt = dateParts.length === 3
    ? new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T12:00:00.000Z`).toISOString()
    : new Date().toISOString();
  const numericAge = Number(animal.idadeAproximada.match(/\d+/)?.[0] ?? 0);
  const numericWeight = Number(animal.peso?.replace(',', '.').match(/\d+(?:\.\d+)?/)?.[0] ?? 0);

  return {
    name: animal.nome,
    breed: animal.raca ?? '',
    species: animal.especie === 'cao' ? 'dog' : animal.especie === 'gato' ? 'cat' : 'other',
    gender: animal.sexo === 'femea' ? 'female' : 'male',
    weightKg: numericWeight,
    age: numericAge,
    ageStage: 0,
    size: animal.porte === 'pequeno' ? 2 : animal.porte === 'medio' ? 3 : 4,
    energyLevel: animal.nivelEnergia === 'baixo' ? 1 : animal.nivelEnergia === 'alto' ? 5 : 3,
    kidFriendly: animal.compativelCriancas === 'sim' ? 5 : animal.compativelCriancas === 'nao' ? 0 : 3,
    noiseLevel: 3,
    apartmentFriendly: animal.compativelApartamento === 'sim',
    otherPetFriendly: animal.compativelAnimais === 'sim',
    healthCondition: animal.condicaoChegada === 'ferido' ? 'injured' : animal.condicaoChegada === 'debilitado' ? 'debilitated' : 'healthy',
    castrated: triState(animal.castrado),
    vaccinated: animal.vacinado === 'sim',
    dewormed: triState(animal.vermifugado),
    rescuedAt,
    place: animal.localResgate,
    mood: animal.humor ?? animal.temperamento,
    observations: animal.observacoes || null,
    status: animal.status === 'em_tratamento' ? 'treating' : animal.status === 'disponivel' ? 'available' : animal.status === 'adotado' ? 'adopted' : 'rescued',
  };
}

