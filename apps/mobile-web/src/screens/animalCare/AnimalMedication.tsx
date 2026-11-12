import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';
import { z } from 'zod';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

export const animalCareProfileSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  status: z.enum(['rescued', 'treating', 'available', 'adopted']),
  medicationNotes: z.string().nullable(),
});

export function MedicationNotes({ notes }: { notes: string | null }) {
  return (
    <View className="gap-1">
      <Text className="font-body-bold text-sm text-ink">Medicação em uso</Text>
      <Text className="font-body text-sm leading-5 text-ink-muted">
        {notes ?? 'Medicação não informada'}
      </Text>
    </View>
  );
}

export function AnimalMedication({ animalId }: { animalId: string }) {
  const { user } = useAuth();
  const { data, isError } = useQuery({
    queryKey: ['animal-care-profile', user?.id, animalId],
    queryFn: async () => animalCareProfileSchema.parse(
      await apiRequest<unknown>(`/animals/care/${encodeURIComponent(animalId)}`),
    ),
    enabled: user?.role === 'volunteer',
  });

  if (!data || isError) {
    return (
      <Text accessibilityLiveRegion="polite" className="font-body text-sm text-ink-muted">
        {isError ? 'Não foi possível consultar a medicação.' : 'Consultando medicação…'}
      </Text>
    );
  }

  return <MedicationNotes notes={data.medicationNotes} />;
}
