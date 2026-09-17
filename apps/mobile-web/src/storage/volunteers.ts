import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Volunteer } from '@/types/volunteer';

const KEY = '@kapa/volunteers';

function isVolunteer(value: unknown): value is Volunteer {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.nome === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.telefone === 'string' &&
    typeof candidate.createdAt === 'string'
  );
}

export async function listVolunteers(): Promise<Volunteer[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isVolunteer) : [];
  } catch {
    return [];
  }
}

export async function saveVolunteer(volunteer: Volunteer): Promise<void> {
  const volunteers = await listVolunteers();
  await AsyncStorage.setItem(KEY, JSON.stringify([volunteer, ...volunteers]));
}
