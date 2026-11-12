import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  UsersIcon,
} from 'phosphor-react-native';
import type { User, UserRole } from '@kapa/shared';
import { useAuth } from '@/hooks/useAuth';
import {
  useAdminUsers,
  useUpdateUserRole,
  useUpdateUserStatus,
} from '@/hooks/useAdminUsers';
import {
  BackLink,
  ChoiceGroup,
  Notice,
  TextButton,
} from '@/screens/animalManagement/components';
import { palette } from '@/theme';
import {
  ManageUserModal,
  RoleBadge,
  UserAvatar,
  UserStatusBadge,
} from './components';
import {
  DEFAULT_FILTERS,
  PAGE_SIZE,
  ROLE_LABELS,
  ROLE_ORDER,
  ROLE_PLURAL_LABELS,
  countByRole,
  filterAndSortUsers,
  formatDate,
  hasActiveFilters,
  paginate,
  readApiErrorMessage,
  type RoleFilter,
  type SortKey,
  type StatusFilter,
  type UserFilters,
} from './model';

const STATUS_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Ativas' },
  { value: 'inactive', label: 'Desativadas' },
];

const SORT_OPTIONS: readonly { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'name', label: 'Nome A–Z' },
];

const SUMMARY_CARDS: readonly { key: RoleFilter; label: string }[] = [
  { key: 'all', label: 'Todos os usuários' },
  ...ROLE_ORDER.map((role) => ({ key: role, label: ROLE_PLURAL_LABELS[role] })),
];

export function UserManagementScreen() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const {
    data: users = [],
    isLoading,
    error,
    refetch,
  } = useAdminUsers(isAdmin);
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();

  const [filters, setFilters] = useState<UserFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const counts = useMemo(() => countByRole(users), [users]);
  const filtered = useMemo(
    () => filterAndSortUsers(users, filters),
    [users, filters],
  );
  const view = paginate(filtered, page, PAGE_SIZE);
  const selected = users.find((item) => item.id === selectedId) ?? null;

  if (!isAdmin) {
    return <Redirect href="/(protected)/(tabs)" />;
  }

  const isFiltered = hasActiveFilters(filters);
  const busy = updateRole.isPending || updateStatus.isPending;

  const changeFilters = (patch: Partial<UserFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };
  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };
  const openUser = (target: User) => {
    setFeedback(null);
    setModalError(null);
    setSelectedId(target.id);
  };
  const closeUser = () => {
    setSelectedId(null);
    setModalError(null);
  };
  const finish = (message: string) => {
    closeUser();
    setFeedback(message);
  };

  const saveRole = (target: User, role: UserRole) => {
    setModalError(null);
    updateRole.mutate(
      { id: target.id, role },
      {
        onSuccess: () =>
          finish(
            `Papel de ${target.username} atualizado para ${ROLE_LABELS[role].toLowerCase()}.`,
          ),
        onError: (failure) => setModalError(readApiErrorMessage(failure)),
      },
    );
  };

  const setActive = (target: User, active: boolean) => {
    setModalError(null);
    updateStatus.mutate(
      { id: target.id, active },
      {
        onSuccess: () =>
          finish(
            active
              ? `${target.username} foi reativado.`
              : `${target.username} foi desativado.`,
          ),
        onError: (failure) => setModalError(readApiErrorMessage(failure)),
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="grow"
      >
        <View className="w-full max-w-content self-center px-5 md:px-10 pb-10 pt-3 gap-6">
          <BackLink />

          <View className="gap-2">
            <Text className="font-body-medium text-xs tracking-widest text-denim">
              ADMINISTRAÇÃO
            </Text>
            <Text
              accessibilityRole="header"
              className="font-heading-bold text-2xl md:text-4xl text-ink"
            >
              Gerenciar usuários
            </Text>
            <Text className="font-body text-base text-ink-muted leading-6">
              Consulte as contas do Kapa, ajuste o papel de cada pessoa e
              desative quem não deve mais acessar o app.
            </Text>
          </View>

          {feedback ? <Notice message={feedback} /> : null}

          <View className="flex-row flex-wrap gap-3">
            {SUMMARY_CARDS.map((card) => {
              const selectedCard = filters.role === card.key;

              return (
                <Pressable
                  key={card.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedCard }}
                  accessibilityLabel={`${card.label}: ${counts[card.key]}`}
                  onPress={() => changeFilters({ role: card.key })}
                  className={`flex-1 min-h-24 rounded-lg border p-4 gap-2 ${
                    card.key === 'all'
                      ? 'min-w-full md:min-w-[150px]'
                      : 'min-w-[150px]'
                  } ${
                    selectedCard
                      ? 'bg-denim border-denim'
                      : 'bg-white border-border hover:bg-peach'
                  }`}
                >
                  <Text
                    className={`font-heading-bold text-2xl ${selectedCard ? 'text-white' : 'text-denim'}`}
                  >
                    {isLoading ? '—' : counts[card.key]}
                  </Text>
                  <Text
                    className={`font-body-medium text-xs ${selectedCard ? 'text-white' : 'text-ink-muted'}`}
                  >
                    {card.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="bg-white rounded-xl border border-border overflow-hidden">
            <View className="p-5 md:p-6 gap-5">
              <View className="flex-col md:flex-row justify-between md:items-center gap-3">
                <View className="gap-1">
                  <Text
                    accessibilityRole="header"
                    className="font-heading-bold text-xl text-ink"
                  >
                    Usuários
                  </Text>
                  <Text className="font-body text-sm text-ink-muted">
                    Busque por nome ou e-mail e use os filtros para encontrar
                    quem você procura.
                  </Text>
                </View>
                {isFiltered ? (
                  <TextButton label="Limpar filtros" onPress={clearFilters} />
                ) : null}
              </View>

              <View className="flex-row items-center gap-3 border border-border bg-cream rounded-md px-4">
                <MagnifyingGlassIcon size={20} color={palette.denim} />
                <TextInput
                  value={filters.search}
                  onChangeText={(search) => changeFilters({ search })}
                  maxLength={120}
                  autoCapitalize="none"
                  placeholder="Buscar por nome ou e-mail"
                  accessibilityLabel="Buscar usuário por nome ou e-mail"
                  placeholderTextColor={palette.inkMuted}
                  className="min-h-12 flex-1 py-3 font-body text-base text-ink"
                />
              </View>

              <View className="flex-col lg:flex-row lg:justify-between gap-5">
                <ChoiceGroup
                  label="Situação"
                  value={filters.status}
                  options={STATUS_OPTIONS}
                  onChange={(status) => changeFilters({ status })}
                />
                <ChoiceGroup
                  label="Ordenar por"
                  value={filters.sort}
                  options={SORT_OPTIONS}
                  onChange={(sort) => changeFilters({ sort })}
                />
              </View>
            </View>

            {isLoading ? (
              <View className="py-16 items-center gap-4">
                <ActivityIndicator color={palette.denim} />
                <Text
                  accessibilityLiveRegion="polite"
                  className="font-body text-ink-muted"
                >
                  Carregando usuários…
                </Text>
              </View>
            ) : error ? (
              <View className="p-6 gap-4">
                <Notice
                  error
                  message="Não foi possível carregar os usuários. Verifique sua conexão e tente novamente."
                />
                <TextButton
                  label="Tentar novamente"
                  onPress={() => void refetch()}
                />
              </View>
            ) : view.items.length > 0 ? (
              <>
                <View className="hidden md:flex flex-row items-center px-6 py-3 bg-cream border-y border-border gap-5">
                  <Text className="flex-1 font-body-medium text-xs text-ink-muted">
                    USUÁRIO
                  </Text>
                  <Text className="w-36 font-body-medium text-xs text-ink-muted">
                    PAPEL
                  </Text>
                  <Text className="w-32 font-body-medium text-xs text-ink-muted">
                    SITUAÇÃO
                  </Text>
                  <Text className="w-28 font-body-medium text-xs text-ink-muted">
                    CADASTRO
                  </Text>
                  <Text className="w-32 text-right font-body-medium text-xs text-ink-muted">
                    AÇÕES
                  </Text>
                </View>

                {view.items.map((item) => (
                  <View
                    key={item.id}
                    className="p-5 md:px-6 flex-col md:flex-row md:items-center gap-4 md:gap-5 border-b border-border"
                  >
                    <View className="flex-row items-center gap-4 flex-1 min-w-0">
                      <UserAvatar user={item} />
                      <View className="flex-1 gap-1">
                        <View className="flex-row flex-wrap items-center gap-2">
                          <Text
                            numberOfLines={1}
                            className="font-heading-bold text-base text-ink"
                          >
                            {item.username}
                          </Text>
                          {item.id === currentUser?.id ? (
                            <Text className="font-body-medium text-xs px-2 py-1 rounded-full bg-peach text-denim">
                              Você
                            </Text>
                          ) : null}
                        </View>
                        <Text
                          numberOfLines={1}
                          className="font-body text-sm text-ink-muted"
                        >
                          {item.email}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row flex-wrap items-center gap-2 md:contents">
                      <View className="md:w-36">
                        <RoleBadge role={item.role} />
                      </View>
                      <View className="md:w-32">
                        <UserStatusBadge active={!item.deactivatedAt} />
                      </View>
                    </View>
                    <Text className="md:hidden font-body text-xs text-ink-muted">
                      Cadastro em {formatDate(item.createdAt)}
                    </Text>
                    <Text className="hidden md:flex md:w-28 font-body text-sm text-ink-muted">
                      {formatDate(item.createdAt)}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Gerenciar ${item.username}`}
                      onPress={() => openUser(item)}
                      className="min-h-12 md:w-32 flex-row items-center justify-center gap-2 border border-border rounded-md px-3 hover:bg-peach active:bg-peach"
                    >
                      <PencilSimpleIcon size={18} color={palette.denim} />
                      <Text className="font-body-medium text-sm text-denim">
                        Gerenciar
                      </Text>
                    </Pressable>
                  </View>
                ))}

                <View className="p-5 gap-4 flex-col md:flex-row md:items-center justify-between">
                  <Text
                    accessibilityLiveRegion="polite"
                    className="font-body text-sm text-ink-muted"
                  >
                    {view.from}–{view.to} de {view.total} usuários
                  </Text>
                  <View className="flex-row items-center gap-3 justify-between">
                    <TextButton
                      label="Anterior"
                      disabled={view.page <= 1}
                      onPress={() => setPage(view.page - 1)}
                    />
                    <Text className="font-body text-sm text-ink">
                      {view.page} / {view.pages}
                    </Text>
                    <TextButton
                      label="Próxima"
                      disabled={view.page >= view.pages}
                      onPress={() => setPage(view.page + 1)}
                    />
                  </View>
                </View>
              </>
            ) : (
              <View className="items-center px-6 py-16 gap-4">
                <View className="p-5 rounded-full bg-peach">
                  <UsersIcon size={40} color={palette.denim} weight="duotone" />
                </View>
                <Text
                  accessibilityRole="header"
                  className="font-heading-bold text-xl text-ink text-center"
                >
                  {isFiltered
                    ? 'Nenhum usuário encontrado'
                    : 'Nenhum usuário cadastrado ainda'}
                </Text>
                <Text className="font-body text-sm text-ink-muted text-center max-w-form">
                  {isFiltered
                    ? 'Experimente outro nome ou ajuste os filtros para encontrar quem você procura.'
                    : 'Quando alguém se cadastrar no Kapa, a conta aparecerá aqui.'}
                </Text>
                {isFiltered ? (
                  <TextButton label="Limpar filtros" onPress={clearFilters} />
                ) : null}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {selected ? (
        <ManageUserModal
          key={selected.id}
          user={selected}
          isSelf={selected.id === currentUser?.id}
          busy={busy}
          error={modalError}
          onClose={closeUser}
          onSaveRole={(role) => saveRole(selected, role)}
          onSetActive={(active) => setActive(selected, active)}
        />
      ) : null}
    </SafeAreaView>
  );
}
