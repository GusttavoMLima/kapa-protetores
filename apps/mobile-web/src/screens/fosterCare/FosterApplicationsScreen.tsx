import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Text, View } from 'react-native';
import { HouseLineIcon } from 'phosphor-react-native';
import { ChoiceGroup } from '@/screens/animalManagement/components';
import { PrimaryButton } from '@/components/buttons/primary';
import { TextButton } from '@/components/buttons/secondary';
import { FormSubmissionLoader } from '@/components/feedback/FormSubmissionLoader';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/ListStates';
import { Notice } from '@/components/feedback/Notice';
import { SearchField } from '@/components/inputText/search';
import { Page } from '@/components/layout/Page';
import { PageHeading } from '@/components/layout/PageHeading';
import { useAuth } from '@/hooks/useAuth';
import { palette } from '@/theme';
import { FosterHomeDetails } from './FosterHomeDetails';
import {
  fetchFosterApplications,
  fosterStatusLabel,
  reviewFosterApplication,
  type FosterApplicationFilters,
  type FosterAvailabilityFilter,
  type FosterDecision,
} from '@/services/fosterApplications';

type StatusFilter = NonNullable<FosterApplicationFilters['status']> | 'all';
type AvailabilityFilter = FosterAvailabilityFilter | 'all';

const STATUS_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Em análise' },
  { value: 'approved', label: 'Aprovadas' },
  { value: 'rejected', label: 'Recusadas' },
];
const AVAILABILITY_OPTIONS: readonly { value: AvailabilityFilter; label: string }[] = [
  { value: 'all', label: 'Qualquer período' },
  { value: 'available', label: 'Disponível agora' },
  { value: 'indefinite', label: 'Prazo indeterminado' },
  { value: 'ended', label: 'Disponibilidade encerrada' },
];

export function FosterApplicationsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [availability, setAvailability] = useState<AvailabilityFilter>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [decision, setDecision] = useState<{ id: string; status: FosterDecision }>();
  const [notice, setNotice] = useState<{ message: string; error: boolean } | null>(null);

  // A lista é paginada no servidor: a busca espera o usuário parar de digitar antes de consultar.
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filters: FosterApplicationFilters = {
    ...(status !== 'all' ? { status } : {}),
    ...(availability !== 'all' ? { availability } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };
  const isFiltered = status !== 'all' || availability !== 'all' || search.trim() !== '';
  const queryPrefix = ['foster-applications', user?.id];
  const applications = useQuery({
    queryKey: [...queryPrefix, page, filters],
    queryFn: () => fetchFosterApplications(page, filters),
    enabled: user?.role === 'admin' || user?.role === 'protector',
  });
  const review = useMutation({
    mutationFn: ({ id, status: next }: { id: string; status: FosterDecision }) => reviewFosterApplication(id, next),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryPrefix });
      setDecision(undefined);
      setNotice({ error: false, message: variables.status === 'approved' ? 'Candidatura aprovada.' : 'Candidatura recusada.' });
    },
    onError: () => {
      setNotice({ error: true, message: 'Não foi possível registrar a decisão. Tente novamente.' });
      void applications.refetch();
    },
  });

  const changeFilter = (apply: () => void) => { apply(); setPage(1); setDecision(undefined); };
  const clearFilters = () => changeFilter(() => { setStatus('all'); setAvailability('all'); setSearch(''); setDebouncedSearch(''); });
  const startDecision = (id: string, next: FosterDecision) => { review.reset(); setNotice(null); setDecision({ id, status: next }); };

  return (
    <>
      <FormSubmissionLoader visible={review.isPending} message="Salvando decisão sobre a candidatura…" />
      <Page backLabel="Gestão">
        <PageHeading eyebrow="GESTÃO DO ABRIGO • LARES TEMPORÁRIOS" icon={HouseLineIcon} title="Candidaturas de Lar Temporário" description="Conheça as famílias que querem acolher um animal por um tempo e decida com calma quem pode receber cada um." />

        <View className="bg-white rounded-xl border border-border p-5 md:p-6 gap-5">
          <SearchField
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nome"
            accessibilityLabel="Buscar candidatura de lar temporário por nome"
          />
          <ChoiceGroup label="Situação" value={status} options={STATUS_OPTIONS} onChange={(next) => changeFilter(() => setStatus(next))} />
          <ChoiceGroup label="Disponibilidade" value={availability} options={AVAILABILITY_OPTIONS} onChange={(next) => changeFilter(() => setAvailability(next))} />
          {isFiltered ? <TextButton label="Limpar filtros" onPress={clearFilters} /> : null}
        </View>

        {notice ? <Notice error={notice.error} message={notice.message} /> : null}

        {applications.isPending ? (
          <LoadingState message="Carregando candidaturas…" />
        ) : applications.isError ? (
          <ErrorState
            message="Não foi possível carregar as candidaturas de Lar Temporário. Verifique sua conexão e tente novamente."
            onRetry={() => void applications.refetch()}
          />
        ) : applications.data.total === 0 ? (
          <EmptyState
            icon={HouseLineIcon}
            title={isFiltered ? 'Nenhuma candidatura encontrada' : 'Nenhuma candidatura recebida ainda'}
            description={isFiltered
              ? 'Experimente outro nome ou ajuste os filtros para encontrar quem você procura.'
              : 'Quando alguém se candidatar para ser Lar Temporário, a ficha aparecerá aqui.'}
            action={isFiltered ? <TextButton label="Limpar filtros" onPress={clearFilters} /> : undefined}
          />
        ) : (
          applications.data.items.map((application) => (
            <View key={application.id} className="gap-3 rounded-2xl border border-line bg-card p-5">
              <Text accessibilityRole="header" className="font-heading-bold text-lg text-ink">
                {application.applicant.username}
              </Text>
              <Text className="font-body text-ink-muted">{application.applicant.email}</Text>
              <Text accessibilityLiveRegion="polite" className="font-body-bold text-denim">
                {fosterStatusLabel[application.status]}
              </Text>
              <FosterHomeDetails application={application} />
              {application.status === 'pending' && (
                decision?.id === application.id ? (
                  <>
                    <Text className="font-body text-ink">
                      {decision.status === 'approved' ? 'Confirmar aprovação?' : 'Confirmar recusa?'}
                    </Text>
                    <View className="flex-row flex-wrap gap-3">
                      <TextButton label="Cancelar" disabled={review.isPending} onPress={() => setDecision(undefined)} />
                      <PrimaryButton
                        title="Confirmar decisão"
                        fullWidth={false}
                        loading={review.isPending}
                        {...(decision.status === 'rejected' ? { color: palette.danger, pressedColor: palette.dangerDark } : {})}
                        onPress={() => review.mutate(decision)}
                      />
                    </View>
                  </>
                ) : (
                  <View className="gap-3">
                    <PrimaryButton
                      title="Aprovar candidatura"
                      accessibilityLabel={`Aprovar candidatura de ${application.applicant.username}`}
                      disabled={review.isPending}
                      onPress={() => startDecision(application.id, 'approved')}
                    />
                    <PrimaryButton
                      title="Recusar candidatura"
                      accessibilityLabel={`Recusar candidatura de ${application.applicant.username}`}
                      color={palette.danger}
                      pressedColor={palette.dangerDark}
                      disabled={review.isPending}
                      onPress={() => startDecision(application.id, 'rejected')}
                    />
                  </View>
                )
              )}
            </View>
          ))
        )}

        {applications.data && applications.data.total > applications.data.pageSize ? (
          <View className="flex-row flex-wrap items-center gap-3">
            <TextButton label="Anterior" disabled={page <= 1 || review.isPending} onPress={() => { setDecision(undefined); setPage(page - 1); }} />
            <Text className="font-body text-sm text-ink-muted">
              Página {page} de {Math.ceil(applications.data.total / applications.data.pageSize)}
            </Text>
            <TextButton label="Próxima" disabled={page * applications.data.pageSize >= applications.data.total || review.isPending} onPress={() => { setDecision(undefined); setPage(page + 1); }} />
          </View>
        ) : null}
      </Page>
    </>
  );
}
