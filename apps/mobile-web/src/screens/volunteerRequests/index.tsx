import { useMemo, useState } from 'react';
import { Redirect, router } from 'expo-router';
import { Text, View } from 'react-native';
import { HandHeartIcon } from 'phosphor-react-native';
import { useAuth } from '@/hooks/useAuth';
import {
  useAdminVolunteerApplications,
  useUpdateVolunteerApplicationStatus,
} from '@/hooks/useVolunteerApplications';
import { PrimaryButton } from '@/components/buttons/primary';
import { TextButton } from '@/components/buttons/secondary';
import { SearchField } from '@/components/inputText/search';
import { Notice } from '@/components/feedback/Notice';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/ListStates';
import { Page } from '@/components/layout/Page';
import { PageHeading } from '@/components/layout/PageHeading';
import { ChoiceGroup } from '@/screens/animalManagement/components';
import {
  VOLUNTEER_AREA_LABELS,
  VOLUNTEER_AVAILABILITY_LABELS,
} from '@/screens/volunteer';
import { palette } from '@/theme';
import {
  VOLUNTEER_STATUS_LABELS,
  countVolunteerApplications,
  filterVolunteerApplications,
  type VolunteerStatusFilter,
} from './model';

const STATUS_CLASS = {
  approved: 'bg-success-soft text-success',
  rejected: 'bg-danger-soft text-danger',
  pending: 'bg-peach text-orange-dark',
} as const;

export function VolunteerRequestsScreen() {
  const { user } = useAuth();
  const { data: applications = [], isLoading, error, refetch } = useAdminVolunteerApplications();
  const { mutate: updateStatus, isPending } = useUpdateVolunteerApplicationStatus();
  const [status, setStatus] = useState<VolunteerStatusFilter>('all');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<{ message: string; error: boolean } | null>(null);

  const counts = useMemo(() => countVolunteerApplications(applications), [applications]);
  const visible = useMemo(
    () => filterVolunteerApplications(applications, status, search),
    [applications, status, search],
  );
  const isFiltered = status !== 'all' || search.trim() !== '';

  if (user?.role !== 'admin' && user?.role !== 'protector') {
    return <Redirect href="/(protected)/(tabs)" />;
  }

  const clearFilters = () => { setStatus('all'); setSearch(''); };
  const decide = (id: string, name: string, decision: 'approved' | 'rejected') => {
    setNotice(null);
    updateStatus({ id, status: decision }, {
      onSuccess: () => setNotice({ error: false, message: decision === 'approved' ? `Candidatura de ${name} aprovada.` : `Candidatura de ${name} recusada.` }),
      onError: () => setNotice({ error: true, message: 'Não foi possível atualizar a candidatura. Tente novamente.' }),
    });
  };

  return (
    <Page
      backLabel="Gestão"
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/(protected)/(tabs)'))}
    >
      <PageHeading eyebrow="GESTÃO DO ABRIGO • NOSSA REDE DE APOIO" icon={HandHeartIcon} title="Candidaturas de voluntários" description="Há sempre espaço para mais carinho. Conheça quem quer somar com a Kapa e encontre novas mãos para os cuidados da semana." />

      <View className="bg-white rounded-xl border border-border p-5 md:p-6 gap-5">
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nome"
          accessibilityLabel="Buscar candidatura por nome"
        />
        <ChoiceGroup
          label="Situação"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: `Todas (${counts.all})` },
            { value: 'pending', label: `Pendentes (${counts.pending})` },
            { value: 'approved', label: `Aprovadas (${counts.approved})` },
            { value: 'rejected', label: `Recusadas (${counts.rejected})` },
          ]}
        />
        {isFiltered ? <TextButton label="Limpar filtros" onPress={clearFilters} /> : null}
      </View>

      {notice ? <Notice error={notice.error} message={notice.message} /> : null}

      {isLoading ? (
        <LoadingState message="Carregando candidaturas…" />
      ) : error ? (
        <ErrorState
          message="Não foi possível carregar as candidaturas de voluntários. Verifique sua conexão e tente novamente."
          onRetry={() => void refetch()}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={HandHeartIcon}
          title={isFiltered ? 'Nenhuma candidatura encontrada' : 'Nenhuma candidatura recebida ainda'}
          description={isFiltered
            ? 'Experimente outro nome ou ajuste os filtros para encontrar quem você procura.'
            : 'Quando alguém enviar o formulário para ser voluntário, a ficha aparecerá aqui.'}
          action={isFiltered ? <TextButton label="Limpar filtros" onPress={clearFilters} /> : undefined}
        />
      ) : (
        visible.map((item) => (
          <View key={item.id} className="bg-white rounded-2xl border border-line p-6 gap-5">
            <View className="flex-row items-start justify-between gap-4">
              <View className="gap-1 flex-1">
                <Text className="font-heading-bold text-xl text-ink">{item.application.fullName}</Text>
                {item.user?.email ? <Text className="font-body text-sm text-ink-muted">{item.user.email}</Text> : null}
              </View>
              <Text className={`font-body-bold text-xs px-3 py-2 rounded-full ${STATUS_CLASS[item.status]}`}>
                {VOLUNTEER_STATUS_LABELS[item.status]}
              </Text>
            </View>

            <View className="bg-cream rounded-xl p-4 gap-1">
              <Text className="font-body-bold text-sm text-denim">Contato e disponibilidade</Text>
              <Text className="font-body text-sm text-ink">Telefone: {item.application.phone}</Text>
              <Text className="font-body text-sm text-ink-muted">
                Disponibilidade: {VOLUNTEER_AVAILABILITY_LABELS[item.application.availability]}
              </Text>
            </View>

            <View className="gap-2">
              <Text className="font-body-bold text-sm text-ink">Áreas de interesse</Text>
              <View className="flex-row flex-wrap gap-2">
                {item.application.areasOfInterest.map((area) => (
                  <View key={area} className="rounded-full bg-peach px-3 py-1">
                    <Text className="font-body-medium text-xs text-denim">{VOLUNTEER_AREA_LABELS[area]}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="bg-cream rounded-xl p-4 gap-1">
              <Text className="font-body-bold text-sm text-ink">Motivação</Text>
              <Text className="font-body text-sm text-ink-muted">{item.application.motivation}</Text>
            </View>

            {item.status === 'pending' ? (
              <View className="gap-3">
                <PrimaryButton
                  title="Aprovar voluntário"
                  loading={isPending}
                  onPress={() => decide(item.id, item.application.fullName, 'approved')}
                />
                <PrimaryButton
                  title="Recusar candidatura"
                  color={palette.danger}
                  pressedColor={palette.dangerDark}
                  disabled={isPending}
                  onPress={() => decide(item.id, item.application.fullName, 'rejected')}
                />
              </View>
            ) : null}
          </View>
        ))
      )}
    </Page>
  );
}
