import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';
import { z } from 'zod';
import { parseMedicationRecords } from '@kapa/shared';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

export const animalCareProfileSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  status: z.enum(['rescued', 'treating', 'available', 'adopted']),
  medicationNotes: z.string().nullable(),
});

export function MedicationNotes({ notes }: { notes: string | null | undefined }) {
  const { medications, legacyNote } = parseMedicationRecords(notes);

  if (medications.length === 0 && !legacyNote) {
    return (
      <View className="gap-1">
        <Text className="font-body-bold text-sm text-ink">Medicação em uso</Text>
        <Text className="font-body text-sm leading-5 text-ink-muted">
          Medicação não informada
        </Text>
      </View>
    );
  }

  if (legacyNote) {
    return (
      <View className="gap-1">
        <Text className="font-body-bold text-sm text-ink">Medicação em uso</Text>
        <Text className="font-body text-sm leading-5 text-ink-muted">
          {legacyNote}
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-2.5 pt-1">
      <Text className="font-body-bold text-sm text-ink">Medicação em uso</Text>
      <View className="gap-2.5">
        {medications.map((medication, index) => (
          <View
            key={`${medication.name}-${index}`}
            className="rounded-xl border border-line bg-cream p-3.5 gap-1.5"
          >
            <View className="flex-row flex-wrap items-center justify-between gap-2">
              <Text className="font-heading-bold text-sm text-ink flex-1 min-w-[120px]">
                {medication.name}
              </Text>
              <View
                className={`rounded-full px-2.5 py-0.5 ${
                  medication.continuousUse
                    ? 'bg-peach'
                    : 'bg-white border border-line'
                }`}
              >
                <Text
                  className={`font-body-medium text-xs ${
                    medication.continuousUse ? 'text-denim' : 'text-ink-muted'
                  }`}
                >
                  {medication.continuousUse
                    ? 'Uso contínuo'
                    : `Período: ${medication.period || 'Não informado'}`}
                </Text>
              </View>
            </View>
            <View className="flex-row flex-wrap gap-x-4 gap-y-1">
              {medication.dose ? (
                <Text className="font-body text-xs text-ink-muted">
                  <Text className="font-body-medium text-ink">Dose:</Text>{' '}
                  {medication.dose}
                </Text>
              ) : null}
              {medication.frequency ? (
                <Text className="font-body text-xs text-ink-muted">
                  <Text className="font-body-medium text-ink">Frequência:</Text>{' '}
                  {medication.frequency}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function AnimalMedication({ animalId }: { animalId: string }) {
  const { user } = useAuth();
  const { data, isError } = useQuery({
    queryKey: ['animal-care-profile', user?.id, animalId],
    queryFn: async () =>
      animalCareProfileSchema.parse(
        await apiRequest<unknown>(
          `/animals/care/${encodeURIComponent(animalId)}`,
        ),
      ),
    enabled: user?.role === 'volunteer',
  });

  if (!data || isError) {
    return (
      <Text
        accessibilityLiveRegion="polite"
        className="font-body text-sm text-ink-muted"
      >
        {isError
          ? 'Não foi possível consultar a medicação.'
          : 'Consultando medicação…'}
      </Text>
    );
  }

  return <MedicationNotes notes={data.medicationNotes} />;
}
