import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRightIcon,
  CalendarIcon,
  CatIcon,
  DogIcon,
  HandHeartIcon,
  HeartIcon,
  PawPrintIcon,
  SparkleIcon,
  UsersIcon,
} from 'phosphor-react-native';
import {
  canManageAnimals,
  SystemEventTypes,
  type DashboardRecentEventItem,
} from '@kapa/shared';
import { useAuth } from '@/hooks/useAuth';
import { useShelterDashboard } from '@/hooks/useShelterDashboard';
import {
  BackLink,
  Notice,
  TextButton,
} from '@/screens/animalManagement/components';
import { palette } from '@/theme';

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function calculatePercent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((part / total) * 100)));
}

export function formatRecentEventDescription(
  item: DashboardRecentEventItem,
): string {
  const actor = item.userName || 'Um usuário';
  const animal = item.animalName || 'um animal';

  switch (item.type) {
    case SystemEventTypes.ADOPTION_REQUESTED:
      return `${actor} enviou solicitação de adoção para ${animal}`;
    case SystemEventTypes.ADOPTION_APPROVED:
      return `Adoção de ${animal} aprovada para ${actor}`;
    case SystemEventTypes.ADOPTION_REJECTED:
      return `Solicitação de adoção de ${animal} encerrada`;
    case SystemEventTypes.VOLUNTEER_APPLICATION_SUBMITTED:
      return `${actor} enviou candidatura ao voluntariado`;
    case SystemEventTypes.VOLUNTEER_APPLICATION_APPROVED:
      return `${actor} teve a candidatura de voluntariado aprovada`;
    case SystemEventTypes.VOLUNTEER_APPLICATION_REJECTED:
      return `Candidatura de voluntariado de ${actor} analisada`;
    case SystemEventTypes.VOLUNTEER_REGISTERED:
      return `${actor} inscreveu-se em uma atividade do abrigo`;
    case SystemEventTypes.ANIMAL_CREATED:
      return `Novo animal acolhido e cadastrado: ${animal}`;
    case SystemEventTypes.ANIMAL_STATUS_UPDATED:
      return `Status de acompanhamento atualizado para ${animal}`;
    case SystemEventTypes.PET_FAVORITED:
      return `${actor} favoritou ${animal}`;
    case SystemEventTypes.USER_REGISTERED:
      return `${actor} criou uma conta na comunidade`;
    default:
      return `Atualização registrada no abrigo (${actor})`;
  }
}

function MetricProgressRow({
  label,
  valueText,
  percent,
  barClassName = 'bg-orange',
}: {
  label: string;
  valueText: string;
  percent: number;
  barClassName?: string;
}) {
  return (
    <View className="gap-1.5">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="font-body-medium text-sm text-ink">{label}</Text>
        <Text className="font-heading-bold text-sm text-denim">{valueText}</Text>
      </View>
      <View className="h-2.5 w-full rounded-full bg-cream overflow-hidden border border-border/60">
        <View
          style={{ width: `${percent}%` }}
          className={`h-full rounded-full ${barClassName}`}
        />
      </View>
    </View>
  );
}

export function DashboardScreen() {
  const { user } = useAuth();
  const allowed = canManageAnimals(user?.role);
  const {
    data: summary,
    isLoading,
    isError,
    refetch,
  } = useShelterDashboard(allowed);

  if (!allowed) {
    return <Redirect href="/(protected)/(tabs)/home" />;
  }

  const totalBudget = summary?.budgetPrediction.totalPredictedBudget ?? 0;
  const activeAdoptionsCount =
    (summary?.adoptions.byStatus.pending ?? 0) +
    (summary?.adoptions.byStatus.interviewing ?? 0);
  const vaccinatedPercent = calculatePercent(
    summary?.animals.activeVaccinatedCount ?? 0,
    summary?.animals.activeInShelter ?? 0,
  );
  const castratedPercent = calculatePercent(
    summary?.animals.activeCastratedCount ?? 0,
    summary?.animals.activeInShelter ?? 0,
  );

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <ScrollView contentContainerClassName="grow">
        <View className="w-full max-w-content self-center px-5 md:px-10 pb-12 pt-3 gap-6">
          <BackLink />

          <View className="flex-col md:flex-row md:items-end justify-between gap-4">
            <View className="gap-1.5 flex-1">
              <Text className="font-body-medium text-xs tracking-widest text-denim">
                PAINEL DO ABRIGO
              </Text>
              <Text
                accessibilityRole="header"
                className="font-heading-bold text-2xl md:text-4xl text-ink"
              >
                Visão geral e indicadores
              </Text>
              <Text className="font-body text-base text-ink-muted leading-6">
                Acompanhe os animais acolhidos, o funil de adoção, a previsão de
                custos por IA e o engajamento da comunidade.
              </Text>
            </View>
            {summary ? (
              <TextButton
                label="Atualizar dados"
                onPress={() => {
                  void refetch();
                }}
              />
            ) : null}
          </View>

          {isLoading ? (
            <View className="py-16 items-center gap-3">
              <ActivityIndicator size="large" color={palette.orange} />
              <Text className="font-body text-ink-muted">
                Carregando indicadores do abrigo…
              </Text>
            </View>
          ) : null}

          {isError ? (
            <View className="gap-3">
              <Notice
                message="Não foi possível carregar os indicadores do painel."
                error
              />
              <TextButton
                label="Tentar novamente"
                onPress={() => {
                  void refetch();
                }}
              />
            </View>
          ) : null}

          {summary ? (
            <>
              {/* Section 1: Top KPI Cards */}
              <View className="flex-row flex-wrap gap-4">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Gerenciar animais do abrigo"
                  onPress={() => router.push('/gestao/animais')}
                  className="flex-1 min-w-[220px] bg-white rounded-2xl border border-border p-5 gap-3"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="size-11 rounded-full bg-peach items-center justify-center">
                      <PawPrintIcon
                        size={22}
                        color={palette.orange}
                        weight="fill"
                      />
                    </View>
                    <ArrowRightIcon size={18} color={palette.denim} />
                  </View>
                  <View className="gap-0.5">
                    <Text className="font-heading-bold text-3xl text-ink">
                      {summary.animals.activeInShelter}
                    </Text>
                    <Text className="font-body-medium text-sm text-ink">
                      Animais sob cuidado
                    </Text>
                    <Text className="font-body text-xs text-ink-muted">
                      {summary.animals.byStatus.available} disponíveis para
                      adoção · {summary.animals.byStatus.adopted} já adotados
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ver solicitações de adoção"
                  onPress={() => router.push('/gestao/solicitacoes')}
                  className="flex-1 min-w-[220px] bg-white rounded-2xl border border-border p-5 gap-3"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="size-11 rounded-full bg-peach items-center justify-center">
                      <HeartIcon size={22} color={palette.denim} weight="fill" />
                    </View>
                    <ArrowRightIcon size={18} color={palette.denim} />
                  </View>
                  <View className="gap-0.5">
                    <Text className="font-heading-bold text-3xl text-ink">
                      {activeAdoptionsCount}
                    </Text>
                    <Text className="font-body-medium text-sm text-ink">
                      Adoções em andamento
                    </Text>
                    <Text className="font-body text-xs text-ink-muted">
                      {summary.adoptions.byStatus.pending} em análise ·{' '}
                      {summary.adoptions.byStatus.interviewing} em entrevista
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ver candidaturas de voluntários"
                  onPress={() => router.push('/(protected)/gestao/voluntarios')}
                  className="flex-1 min-w-[220px] bg-white rounded-2xl border border-border p-5 gap-3"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="size-11 rounded-full bg-peach items-center justify-center">
                      <HandHeartIcon
                        size={22}
                        color={palette.denim}
                        weight="fill"
                      />
                    </View>
                    <ArrowRightIcon size={18} color={palette.denim} />
                  </View>
                  <View className="gap-0.5">
                    <Text className="font-heading-bold text-3xl text-ink">
                      {summary.volunteers.pendingApplicationsCount}
                    </Text>
                    <Text className="font-body-medium text-sm text-ink">
                      Candidaturas pendentes
                    </Text>
                    <Text className="font-body text-xs text-ink-muted">
                      {summary.volunteers.upcomingEventsCount} atividades
                      programadas ({summary.volunteers.upcomingVolunteerSignupsCount}
                      /{summary.volunteers.upcomingTotalVacancies} vagas)
                    </Text>
                  </View>
                </Pressable>

                <View className="flex-1 min-w-[220px] bg-white rounded-2xl border border-border p-5 gap-3">
                  <View className="flex-row items-center justify-between">
                    <View className="size-11 rounded-full bg-peach items-center justify-center">
                      <SparkleIcon
                        size={22}
                        color={palette.orange}
                        weight="fill"
                      />
                    </View>
                    <View className="px-2.5 py-1 rounded-full bg-peach">
                      <Text className="font-body-semibold text-xs text-denim">
                        IA · ONNX
                      </Text>
                    </View>
                  </View>
                  <View className="gap-0.5">
                    <Text className="font-heading-bold text-2xl md:text-3xl text-orange-dark">
                      {formatCurrencyBRL(totalBudget)}
                    </Text>
                    <Text className="font-body-medium text-sm text-ink">
                      Orçamento mensal previsto
                    </Text>
                    <Text className="font-body text-xs text-ink-muted">
                      Média de{' '}
                      {formatCurrencyBRL(
                        summary.budgetPrediction.averageCostPerAnimal,
                      )}{' '}
                      / animal ativo
                    </Text>
                  </View>
                </View>
              </View>

              {/* Section 2: Enriched ONNX Machine Learning Cost Breakdown */}
              <View className="bg-white rounded-2xl border border-border p-5 md:p-6 gap-5">
                <View className="gap-1">
                  <View className="flex-row items-center gap-2">
                    <SparkleIcon
                      size={20}
                      color={palette.orange}
                      weight="fill"
                    />
                    <Text
                      accessibilityRole="header"
                      className="font-heading-bold text-xl text-ink"
                    >
                      Detalhamento de Custos Mensais (IA · ONNX)
                    </Text>
                  </View>
                  <Text className="font-body text-sm text-ink-muted">
                    Decomposição automática por insumo, espécie e porte com base
                    no perfil clínico e nutricional de cada animal acolhido.
                  </Text>
                </View>

                {/* Cost by Category */}
                <View className="gap-3">
                  <Text className="font-body-semibold text-xs tracking-wider text-denim uppercase">
                    Custo Previsto por Categoria de Despesa
                  </Text>
                  <View className="flex-col md:flex-row gap-4">
                    <View className="flex-1 gap-3">
                      <MetricProgressRow
                        label="Alimentação e Dieta"
                        valueText={`${formatCurrencyBRL(summary.budgetPrediction.byCategory.nutrition)} (${calculatePercent(summary.budgetPrediction.byCategory.nutrition, totalBudget)}%)`}
                        percent={calculatePercent(
                          summary.budgetPrediction.byCategory.nutrition,
                          totalBudget,
                        )}
                        barClassName="bg-orange"
                      />
                      <MetricProgressRow
                        label="Veterinário e Reabilitação"
                        valueText={`${formatCurrencyBRL(summary.budgetPrediction.byCategory.veterinary)} (${calculatePercent(summary.budgetPrediction.byCategory.veterinary, totalBudget)}%)`}
                        percent={calculatePercent(
                          summary.budgetPrediction.byCategory.veterinary,
                          totalBudget,
                        )}
                        barClassName="bg-denim"
                      />
                    </View>
                    <View className="flex-1 gap-3">
                      <MetricProgressRow
                        label="Vacinas, Vermífugo e Castração"
                        valueText={`${formatCurrencyBRL(summary.budgetPrediction.byCategory.preventives)} (${calculatePercent(summary.budgetPrediction.byCategory.preventives, totalBudget)}%)`}
                        percent={calculatePercent(
                          summary.budgetPrediction.byCategory.preventives,
                          totalBudget,
                        )}
                        barClassName="bg-denim"
                      />
                      <MetricProgressRow
                        label="Higiene, Limpeza e Manejo"
                        valueText={`${formatCurrencyBRL(summary.budgetPrediction.byCategory.hygiene)} (${calculatePercent(summary.budgetPrediction.byCategory.hygiene, totalBudget)}%)`}
                        percent={calculatePercent(
                          summary.budgetPrediction.byCategory.hygiene,
                          totalBudget,
                        )}
                        barClassName="bg-orange"
                      />
                    </View>
                  </View>
                </View>

                {/* Cost per Dog / Cat / Size */}
                <View className="gap-3 pt-3 border-t border-border">
                  <Text className="font-body-semibold text-xs tracking-wider text-denim uppercase">
                    Custo Médio e Total por Espécie e Porte
                  </Text>
                  <View className="flex-row flex-wrap gap-3">
                    <View className="flex-1 min-w-[180px] rounded-xl bg-cream p-4 gap-1 border border-border/60">
                      <View className="flex-row items-center gap-2">
                        <DogIcon size={18} color={palette.orange} weight="fill" />
                        <Text className="font-body-semibold text-sm text-ink">
                          Cães ({summary.budgetPrediction.bySpecies.dog.count})
                        </Text>
                      </View>
                      <Text className="font-heading-bold text-xl text-denim">
                        {formatCurrencyBRL(
                          summary.budgetPrediction.bySpecies.dog.totalCost,
                        )}
                      </Text>
                      <Text className="font-body text-xs text-ink-muted">
                        Média de{' '}
                        {formatCurrencyBRL(
                          summary.budgetPrediction.bySpecies.dog.averageCost,
                        )}{' '}
                        / cão · Ração:{' '}
                        {formatCurrencyBRL(
                          summary.budgetPrediction.bySpecies.dog.breakdown
                            .nutrition,
                        )}
                      </Text>
                    </View>

                    <View className="flex-1 min-w-[180px] rounded-xl bg-cream p-4 gap-1 border border-border/60">
                      <View className="flex-row items-center gap-2">
                        <CatIcon size={18} color={palette.denim} weight="fill" />
                        <Text className="font-body-semibold text-sm text-ink">
                          Gatos ({summary.budgetPrediction.bySpecies.cat.count})
                        </Text>
                      </View>
                      <Text className="font-heading-bold text-xl text-denim">
                        {formatCurrencyBRL(
                          summary.budgetPrediction.bySpecies.cat.totalCost,
                        )}
                      </Text>
                      <Text className="font-body text-xs text-ink-muted">
                        Média de{' '}
                        {formatCurrencyBRL(
                          summary.budgetPrediction.bySpecies.cat.averageCost,
                        )}{' '}
                        / gato · Ração:{' '}
                        {formatCurrencyBRL(
                          summary.budgetPrediction.bySpecies.cat.breakdown
                            .nutrition,
                        )}
                      </Text>
                    </View>

                    <View className="flex-1 min-w-[180px] rounded-xl bg-cream p-4 gap-1 border border-border/60">
                      <Text className="font-body-semibold text-sm text-ink">
                        Por Porte (P / M / G)
                      </Text>
                      <Text className="font-body text-xs text-ink-muted">
                        Pequeno ({summary.budgetPrediction.bySize.small.count}):{' '}
                        {formatCurrencyBRL(
                          summary.budgetPrediction.bySize.small.averageCost,
                        )}{' '}
                        / animal
                      </Text>
                      <Text className="font-body text-xs text-ink-muted">
                        Médio ({summary.budgetPrediction.bySize.medium.count}):{' '}
                        {formatCurrencyBRL(
                          summary.budgetPrediction.bySize.medium.averageCost,
                        )}{' '}
                        / animal
                      </Text>
                      <Text className="font-body text-xs text-ink-muted">
                        Grande ({summary.budgetPrediction.bySize.large.count}):{' '}
                        {formatCurrencyBRL(
                          summary.budgetPrediction.bySize.large.averageCost,
                        )}{' '}
                        / animal
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Section 3: Adoption Funnel & Animal Health/Triage */}
              <View className="flex-col lg:flex-row gap-5">
                <View className="flex-1 bg-white rounded-2xl border border-border p-5 md:p-6 gap-4">
                  <View className="flex-row items-center justify-between gap-2">
                    <View className="gap-0.5">
                      <Text
                        accessibilityRole="header"
                        className="font-heading-bold text-lg text-ink"
                      >
                        Funil de Adoção
                      </Text>
                      <Text className="font-body text-xs text-ink-muted">
                        {summary.adoptions.total} solicitações registradas ·{' '}
                        {summary.adoptions.approvalRatePercent}% de aprovação
                      </Text>
                    </View>
                    <View className="px-3 py-1 rounded-full bg-peach">
                      <Text className="font-body-semibold text-xs text-denim">
                        {summary.animals.totalFavoritesCount} favoritados
                      </Text>
                    </View>
                  </View>

                  <View className="gap-3">
                    <MetricProgressRow
                      label="Em análise (pendentes)"
                      valueText={String(summary.adoptions.byStatus.pending)}
                      percent={calculatePercent(
                        summary.adoptions.byStatus.pending,
                        summary.adoptions.total,
                      )}
                      barClassName="bg-orange"
                    />
                    <MetricProgressRow
                      label="Em entrevista e contrato"
                      valueText={String(summary.adoptions.byStatus.interviewing)}
                      percent={calculatePercent(
                        summary.adoptions.byStatus.interviewing,
                        summary.adoptions.total,
                      )}
                      barClassName="bg-denim"
                    />
                    <MetricProgressRow
                      label="Adoções concluídas (aprovadas)"
                      valueText={String(summary.adoptions.byStatus.approved)}
                      percent={calculatePercent(
                        summary.adoptions.byStatus.approved,
                        summary.adoptions.total,
                      )}
                      barClassName="bg-orange"
                    />
                    <MetricProgressRow
                      label="Não aprovadas / canceladas"
                      valueText={String(
                        summary.adoptions.byStatus.rejected +
                          summary.adoptions.byStatus.canceled,
                      )}
                      percent={calculatePercent(
                        summary.adoptions.byStatus.rejected +
                          summary.adoptions.byStatus.canceled,
                        summary.adoptions.total,
                      )}
                      barClassName="bg-denim"
                    />
                  </View>
                </View>

                <View className="flex-1 bg-white rounded-2xl border border-border p-5 md:p-6 gap-4">
                  <View className="gap-0.5">
                    <Text
                      accessibilityRole="header"
                      className="font-heading-bold text-lg text-ink"
                    >
                      Saúde e Triagem dos Animais Ativos
                    </Text>
                    <Text className="font-body text-xs text-ink-muted">
                      Cobertura sanitária entre os{' '}
                      {summary.animals.activeInShelter} animais atualmente no
                      abrigo
                    </Text>
                  </View>

                  <View className="gap-3">
                    <MetricProgressRow
                      label="Animais vacinados"
                      valueText={`${summary.animals.activeVaccinatedCount}/${summary.animals.activeInShelter} (${vaccinatedPercent}%)`}
                      percent={vaccinatedPercent}
                      barClassName="bg-orange"
                    />
                    <MetricProgressRow
                      label="Animais castrados"
                      valueText={`${summary.animals.activeCastratedCount}/${summary.animals.activeInShelter} (${castratedPercent}%)`}
                      percent={castratedPercent}
                      barClassName="bg-denim"
                    />
                  </View>

                  <View className="flex-row flex-wrap gap-2 pt-2 border-t border-border">
                    <View className="flex-1 min-w-[100px] rounded-lg bg-cream p-3 gap-0.5">
                      <Text className="font-body text-xs text-ink-muted">
                        Saudáveis
                      </Text>
                      <Text className="font-heading-bold text-base text-denim">
                        {summary.animals.activeByCondition.healthy}
                      </Text>
                    </View>
                    <View className="flex-1 min-w-[100px] rounded-lg bg-cream p-3 gap-0.5">
                      <Text className="font-body text-xs text-ink-muted">
                        Feridos
                      </Text>
                      <Text className="font-heading-bold text-base text-orange-dark">
                        {summary.animals.activeByCondition.injured}
                      </Text>
                    </View>
                    <View className="flex-1 min-w-[100px] rounded-lg bg-cream p-3 gap-0.5">
                      <Text className="font-body text-xs text-ink-muted">
                        Debilitados
                      </Text>
                      <Text className="font-heading-bold text-base text-orange-dark">
                        {summary.animals.activeByCondition.debilitated}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Section 4: Community & Recent Activity */}
              <View className="flex-col lg:flex-row gap-5">
                <View className="flex-1 bg-white rounded-2xl border border-border p-5 md:p-6 gap-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <UsersIcon size={20} color={palette.denim} weight="fill" />
                      <Text
                        accessibilityRole="header"
                        className="font-heading-bold text-lg text-ink"
                      >
                        Comunidade e Equipe
                      </Text>
                    </View>
                    {user?.role === 'admin' ? (
                      <TextButton
                        label="Gerenciar contas"
                        onPress={() => router.push('/(protected)/gestao/usuarios')}
                      />
                    ) : null}
                  </View>

                  <View className="flex-row flex-wrap gap-3">
                    <View className="flex-1 min-w-[120px] rounded-xl bg-cream p-3 gap-0.5">
                      <Text className="font-body text-xs text-ink-muted">
                        Adotantes
                      </Text>
                      <Text className="font-heading-bold text-lg text-denim">
                        {summary.users.byRole.adopter}
                      </Text>
                    </View>
                    <View className="flex-1 min-w-[120px] rounded-xl bg-cream p-3 gap-0.5">
                      <Text className="font-body text-xs text-ink-muted">
                        Voluntários
                      </Text>
                      <Text className="font-heading-bold text-lg text-denim">
                        {summary.users.byRole.volunteer}
                      </Text>
                    </View>
                    <View className="flex-1 min-w-[120px] rounded-xl bg-cream p-3 gap-0.5">
                      <Text className="font-body text-xs text-ink-muted">
                        Protetores / Admins
                      </Text>
                      <Text className="font-heading-bold text-lg text-denim">
                        {summary.users.byRole.protector +
                          summary.users.byRole.admin}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Organizar atividades da semana"
                    onPress={() => router.push('/(protected)/manage-activities')}
                    className="flex-row items-center justify-between rounded-xl bg-peach/60 p-4 border border-border"
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <CalendarIcon
                        size={20}
                        color={palette.denim}
                        weight="fill"
                      />
                      <View className="flex-1">
                        <Text className="font-body-semibold text-sm text-ink">
                          Escalas e Atividades da Semana
                        </Text>
                        <Text className="font-body text-xs text-ink-muted">
                          {summary.volunteers.upcomingEventsCount} eventos ·{' '}
                          {summary.volunteers.upcomingVolunteerSignupsCount} de{' '}
                          {summary.volunteers.upcomingTotalVacancies} vagas
                          preenchidas
                        </Text>
                      </View>
                    </View>
                    <ArrowRightIcon size={18} color={palette.denim} />
                  </Pressable>
                </View>

                <View className="flex-1 bg-white rounded-2xl border border-border p-5 md:p-6 gap-4">
                  <Text
                    accessibilityRole="header"
                    className="font-heading-bold text-lg text-ink"
                  >
                    Atividades Recentes no Abrigo
                  </Text>
                  {summary.recentEvents.length === 0 ? (
                    <Text className="font-body text-sm text-ink-muted">
                      Nenhuma movimentação recente registrada.
                    </Text>
                  ) : (
                    <View className="gap-3">
                      {summary.recentEvents.map((eventItem) => (
                        <View
                          key={eventItem.id}
                          className="flex-row items-start justify-between gap-3 pb-3 border-b border-border/60"
                        >
                          <Text className="font-body text-sm text-ink flex-1">
                            {formatRecentEventDescription(eventItem)}
                          </Text>
                          <Text className="font-body text-xs text-ink-muted">
                            {new Date(eventItem.emittedAt).toLocaleDateString(
                              'pt-BR',
                            )}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
