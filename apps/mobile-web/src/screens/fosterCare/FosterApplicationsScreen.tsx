import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackLink } from '@/screens/animalManagement/components';
import { PrimaryButton } from '@/components/buttons/primary';
import { useAuth } from '@/hooks/useAuth';
import { FosterHomeDetails } from './FosterHomeDetails';
import {
  fetchFosterApplications,
  fosterStatusLabel,
  reviewFosterApplication,
  type FosterDecision,
} from '@/services/fosterApplications';

export function FosterApplicationsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [decision, setDecision] = useState<{ id: string; status: FosterDecision }>();
  const queryPrefix = ['foster-applications', user?.id];
  const applications = useQuery({
    queryKey: [...queryPrefix, page],
    queryFn: () => fetchFosterApplications(page),
    enabled: user?.role === 'admin' || user?.role === 'protector',
  });
  const review = useMutation({
    mutationFn: ({ id, status }: { id: string; status: FosterDecision }) => reviewFosterApplication(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryPrefix });
      setDecision(undefined);
    },
    onError: () => void applications.refetch(),
  });

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <ScrollView>
        <View className="w-full max-w-content self-center gap-4 px-5 pb-10 pt-3 md:px-10">
          <BackLink label="Gestão do abrigo" />
          <Text accessibilityRole="header" className="font-heading-bold text-2xl text-ink">
            Candidaturas de Lar Temporário
          </Text>
          {applications.isPending && (
            <Text accessibilityLiveRegion="polite" className="font-body text-ink-muted">Carregando candidaturas…</Text>
          )}
          {applications.isError && (
            <>
              <Text accessibilityRole="alert" className="font-body text-danger">Não foi possível carregar as candidaturas.</Text>
              <PrimaryButton title="Tentar novamente" fullWidth={false} onPress={() => void applications.refetch()} />
            </>
          )}
          {applications.data?.total === 0 && (
            <Text className="font-body text-ink-muted">Nenhuma candidatura recebida.</Text>
          )}
          {applications.data?.items.map((application) => (
            <View key={application.id} className="gap-3 rounded-2xl border border-line bg-card p-5">
              <Text accessibilityRole="header" className="font-heading-bold text-lg text-ink">
                {application.applicant.username}
              </Text>
              <Text className="font-body text-ink-muted">{application.applicant.email}</Text>
              <Text accessibilityLiveRegion="polite" className="font-body-bold text-denim">
                {fosterStatusLabel[application.status]}
              </Text>
              <FosterHomeDetails application={application} />
              {decision?.id === application.id && review.isError && (
                <Text accessibilityRole="alert" className="font-body text-danger">Não foi possível registrar a decisão.</Text>
              )}
              {application.status === 'pending' && (
                decision?.id === application.id ? (
                  <>
                    <Text className="font-body text-ink">
                      {decision.status === 'approved' ? 'Confirmar aprovação?' : 'Confirmar recusa?'}
                    </Text>
                    <View className="flex-row flex-wrap gap-3">
                      <PrimaryButton title="Cancelar" fullWidth={false} disabled={review.isPending} onPress={() => setDecision(undefined)} />
                      <PrimaryButton title="Confirmar decisão" fullWidth={false} loading={review.isPending} onPress={() => review.mutate(decision)} />
                    </View>
                  </>
                ) : (
                  <View className="flex-row flex-wrap gap-3">
                    <PrimaryButton title="Aprovar" accessibilityLabel={`Aprovar candidatura de ${application.applicant.username}`} fullWidth={false} disabled={review.isPending} onPress={() => { review.reset(); setDecision({ id: application.id, status: 'approved' }); }} />
                    <PrimaryButton title="Recusar" accessibilityLabel={`Recusar candidatura de ${application.applicant.username}`} fullWidth={false} disabled={review.isPending} onPress={() => { review.reset(); setDecision({ id: application.id, status: 'rejected' }); }} />
                  </View>
                )
              )}
            </View>
          ))}
          <View className="flex-row flex-wrap gap-3">
            {page > 1 && <PrimaryButton title="Anterior" disabled={review.isPending} fullWidth={false} onPress={() => { setDecision(undefined); setPage(page - 1); }} />}
            {applications.data && page * applications.data.pageSize < applications.data.total && (
              <PrimaryButton title="Próxima" disabled={review.isPending} fullWidth={false} onPress={() => { setDecision(undefined); setPage(page + 1); }} />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
