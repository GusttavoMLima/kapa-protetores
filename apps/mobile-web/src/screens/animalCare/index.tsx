import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { z } from 'zod';
import { PrimaryButton } from '@/components/buttons/primary';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/services/api';
import { statusLabel } from '../animalManagement/model';
import { animalCareProfileSchema, MedicationNotes } from './AnimalMedication';

const carePageSchema = z.object({
  items: z.array(animalCareProfileSchema),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});

export function AnimalCareScreen() {
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const { data, isError, refetch } = useQuery({
    queryKey: ['animal-care-page', user?.id, page],
    queryFn: async () => carePageSchema.parse(await apiRequest<unknown>(`/animals/care?page=${page}`)),
    enabled: user?.role === 'volunteer',
  });

  if (user?.role !== 'volunteer') return null;

  return (
    <ScrollView className="flex-1 bg-cream">
      <View className="w-full max-w-5xl self-center gap-4 p-4 md:p-8">
        <PrimaryButton title="Voltar ao voluntariado" fullWidth={false} onPress={() => router.replace('/volunteer')} />
        <Text accessibilityRole="header" className="font-heading-bold text-2xl text-ink">
          Cuidados dos animais
        </Text>
        {isError ? (
          <View className="gap-3">
            <Text accessibilityRole="alert" className="font-body text-sm text-danger">
              Não foi possível consultar a medicação dos animais.
            </Text>
            <PrimaryButton title="Tentar novamente" fullWidth={false} onPress={() => void refetch()} />
          </View>
        ) : (
          <>
            <Text accessibilityLiveRegion="polite" className="font-body text-sm text-ink-muted">
              {data ? (data.total ? `Página ${page} de ${Math.ceil(data.total / data.pageSize)}` : 'Nenhum animal encontrado.') : 'Carregando animais…'}
            </Text>
            {data?.items.map((animal) => (
              <View key={animal.id} className="gap-2 rounded-2xl border border-line bg-card p-4">
                <Text accessibilityRole="header" className="font-heading-bold text-lg text-ink">
                  {animal.name}
                </Text>
                <Text className="font-body text-sm text-ink-muted">{statusLabel[animal.status]}</Text>
                <MedicationNotes notes={animal.medicationNotes} />
              </View>
            ))}
          </>
        )}
        <View className="flex-row flex-wrap gap-3">
          {page > 1 ? <PrimaryButton title="Anterior" fullWidth={false} onPress={() => setPage(page - 1)} /> : null}
          {data && page * data.pageSize < data.total ? (
            <PrimaryButton title="Próxima" fullWidth={false} onPress={() => setPage(page + 1)} />
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}
