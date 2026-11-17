import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Animal, LegacyAnimal } from '../types/animal';
import type { CreateAnimalInput } from '@kapa/shared';
import { apiRequest, ApiError } from '@/services/api';
import { Platform } from 'react-native';

const KEY = '@kapa/animals';
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_RESIZED_PHOTO_DIMENSION = 1600;

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
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) throw new ApiError('Não foi possível abrir a foto selecionada.', 400);
    const blob = await prepareWebPhoto(await response.blob());
    form.append('photo', blob, `animal.${extensionForMime(blob.type)}`);
  } else {
    const extension = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const type = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
    form.append('photo', { uri, name: `animal.${extensionForMime(type)}`, type } as unknown as Blob);
  }
  await apiRequest(`/animals/${encodeURIComponent(animalId)}/photos`, { method: 'POST', body: form });
}

export async function uploadAnimalPhotos(
  animalId: string,
  uris: string[],
): Promise<{ uploaded: number; failures: { uri: string; message: string }[] }> {
  let uploaded = 0;
  const failures: { uri: string; message: string }[] = [];

  // Upload in reverse so `uris[0]` (marked as "Capa") gets the most recent
  // `uploaded_at` timestamp and is returned first by `orderBy: { uploaded_at: 'desc' }`.
  for (const uri of [...uris].reverse()) {
    try {
      await uploadAnimalPhoto(animalId, uri);
      uploaded += 1;
    } catch (error) {
      failures.unshift({
        uri,
        message: error instanceof ApiError && error.status === 400
          ? error.responseMessage ?? error.message
          : 'Não foi possível enviar a foto. Tente novamente.',
      });
    }
  }

  return { uploaded, failures };
}

async function prepareWebPhoto(photo: Blob): Promise<Blob> {
  if (photo.size < MAX_PHOTO_BYTES) return photo;

  try {
    const image = await createImageBitmap(photo);
    try {
      const scale = Math.min(1, MAX_RESIZED_PHOTO_DIMENSION / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const resized = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
        if (resized && resized.size < MAX_PHOTO_BYTES) return resized;
      }
    } finally {
      image.close();
    }
  } catch {
    throw new ApiError('Não foi possível preparar a foto. Selecione um JPEG, PNG ou WebP de até 5 MB.', 400);
  }

  throw new ApiError('Não foi possível reduzir a foto para menos de 5 MB. Selecione um arquivo menor.', 400);
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
    v10Doses: animal.v10Doses ?? [animal.v10PrimeiraDose, animal.v10SegundaDose].filter((dose) => dose !== undefined),
    vacinaRaivaDoses: animal.vacinaRaivaDoses ?? (animal.vacinaRaiva ? [animal.vacinaRaiva] : []),
    vermifugoDoses: animal.vermifugoDoses ?? [],
    rescuedAt,
    place: animal.localResgate,
    mood: animal.humor ?? animal.temperamento,
    observations: animal.observacoes || null,
    medicationNotes: animal.medicacaoEmUso?.trim() || null,
    status: animal.status === 'em_tratamento' ? 'treating' : animal.status === 'disponivel' ? 'available' : animal.status === 'adotado' ? 'adopted' : 'rescued',
  };
}

