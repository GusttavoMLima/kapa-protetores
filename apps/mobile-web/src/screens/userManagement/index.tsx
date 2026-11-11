import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UsersIcon } from 'phosphor-react-native';
import type { User, UserRole } from '@kapa/shared';
import { useAuth } from '@/hooks/useAuth';
import {
  useAdminUsers,
  useUpdateUserRole,
  useUpdateUserStatus,
} from '@/hooks/useAdminUsers';
import {
  BackLink,
  Notice,
  TextButton,
} from '@/screens/animalManagement/components';
import { palette } from '@/theme';

export const ROLE_LABELS: Record<UserRole, string> = {
  adopter: 'Adotante',
  volunteer: 'Voluntário',
  protector: 'Protetor',
  admin: 'Administrador',
};

const ROLE_OPTIONS = Object.keys(ROLE_LABELS) as UserRole[];

type RoleFilter = UserRole | 'all';

interface PendingAction {
  title: string;
  message: string;
  confirmLabel: string;
  run: () => void;
}

export function filterUsers(
  users: readonly User[],
  search: string,
  role: RoleFilter,
): User[] {
  const term = search.trim().toLowerCase();

  return users.filter((user) => {
    if (role !== 'all' && user.role !== role) return false;
    if (!term) return true;
    return (
      user.username.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  });
}

export function readApiErrorMessage(error: unknown): string {
  const message = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;

  return typeof message === 'string' && message
    ? message
    : 'Não foi possível concluir a ação. Tente novamente.';
}

function Chip({
  label,
  selected,
  onPress,
  disabled = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-12 px-4 rounded-full items-center justify-center border ${
        selected ? 'bg-peach border-denim' : 'bg-white border-border'
      } ${disabled ? 'opacity-40' : ''}`}
    >
      <Text className="font-body-medium text-sm text-denim">{label}</Text>
    </Pressable>
  );
}

function UserRow({
  user,
  isSelf,
  busy,
  onChangeRole,
  onToggleStatus,
}: {
  user: User;
  isSelf: boolean;
  busy: boolean;
  onChangeRole: (role: UserRole) => void;
  onToggleStatus: () => void;
}) {
  const active = !user.deactivatedAt;

  return (
    <View className="bg-white rounded-2xl border border-line p-5 gap-4">
      <View className="gap-1">
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="font-heading-bold text-lg text-ink">
            {user.username}
          </Text>
          <Text
            className={`font-body-medium text-xs px-3 py-1 rounded-full ${
              active ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
            }`}
          >
            {active ? 'Ativo' : 'Desativado'}
          </Text>
          {isSelf ? (
            <Text className="font-body-medium text-xs px-3 py-1 rounded-full bg-peach text-denim">
              Você
            </Text>
          ) : null}
        </View>
        <Text className="font-body text-sm text-ink-muted">{user.email}</Text>
      </View>

      <View className="gap-2">
        <Text className="font-body-medium text-sm text-ink">Papel</Text>
        <View className="flex-row flex-wrap gap-2">
          {ROLE_OPTIONS.map((role) => (
            <Chip
              key={role}
              label={ROLE_LABELS[role]}
              selected={user.role === role}
              disabled={busy || isSelf || user.role === role}
              onPress={() => onChangeRole(role)}
            />
          ))}
        </View>
      </View>

      <TextButton
        label={active ? 'Desativar conta' : 'Reativar conta'}
        disabled={busy || isSelf}
        onPress={onToggleStatus}
      />
      {isSelf ? (
        <Text className="font-body text-xs text-ink-muted">
          Você não pode alterar a sua própria conta por aqui.
        </Text>
      ) : null}
    </View>
  );
}

export function UserManagementScreen() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const { data: users = [], isLoading, error } = useAdminUsers(isAdmin);
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    error: boolean;
  } | null>(null);

  const visibleUsers = useMemo(
    () => filterUsers(users, search, roleFilter),
    [users, search, roleFilter],
  );

  if (!isAdmin) {
    return <Redirect href="/(protected)/(tabs)" />;
  }

  const busy = updateRole.isPending || updateStatus.isPending;

  const onSuccess = (message: string) => setFeedback({ message, error: false });
  const onFailure = (failure: unknown) =>
    setFeedback({ message: readApiErrorMessage(failure), error: true });

  const requestRoleChange = (target: User, role: UserRole) =>
    setPending({
      title: 'Alterar papel?',
      message: `${target.username} passará a ser ${ROLE_LABELS[role].toLowerCase()}.`,
      confirmLabel: 'Alterar papel',
      run: () =>
        updateRole.mutate(
          { id: target.id, role },
          {
            onSuccess: () => onSuccess(`Papel de ${target.username} atualizado.`),
            onError: onFailure,
          },
        ),
    });

  const requestStatusChange = (target: User) => {
    const activate = Boolean(target.deactivatedAt);

    setPending({
      title: activate ? 'Reativar conta?' : 'Desativar conta?',
      message: activate
        ? `${target.username} poderá entrar no Kapa novamente.`
        : `${target.username} não poderá mais entrar no Kapa. Os dados da conta são mantidos.`,
      confirmLabel: activate ? 'Reativar' : 'Desativar',
      run: () =>
        updateStatus.mutate(
          { id: target.id, active: activate },
          {
            onSuccess: () =>
              onSuccess(
                activate
                  ? `${target.username} foi reativado.`
                  : `${target.username} foi desativado.`,
              ),
            onError: onFailure,
          },
        ),
    });
  };

  const confirm = () => {
    const action = pending;
    setPending(null);
    setFeedback(null);
    action?.run();
  };

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 20 }}
      >
        <BackLink />

        <View className="items-center bg-white rounded-2xl border border-line px-5 py-6 gap-2">
          <View className="w-12 h-12 rounded-full bg-peach items-center justify-center">
            <UsersIcon size={26} color={palette.orange} weight="fill" />
          </View>
          <Text
            accessibilityRole="header"
            className="font-heading-bold text-3xl text-ink text-center"
          >
            Gerenciar usuários
          </Text>
          <Text className="font-body text-base text-ink-muted text-center">
            Consulte as contas, altere o papel de cada pessoa e desative quem não
            deve mais acessar o Kapa.
          </Text>
        </View>

        {feedback ? (
          <Notice message={feedback.message} error={feedback.error} />
        ) : null}

        <View className="gap-3">
          <TextInput
            accessibilityLabel="Buscar usuário por nome ou e-mail"
            placeholder="Buscar por nome ou e-mail"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            className="min-h-12 px-4 rounded-md bg-white border border-border font-body text-base text-ink"
          />
          <View className="flex-row flex-wrap gap-2">
            <Chip
              label="Todos"
              selected={roleFilter === 'all'}
              onPress={() => setRoleFilter('all')}
            />
            {ROLE_OPTIONS.map((role) => (
              <Chip
                key={role}
                label={ROLE_LABELS[role]}
                selected={roleFilter === role}
                onPress={() => setRoleFilter(role)}
              />
            ))}
          </View>
        </View>

        {isLoading ? (
          <View className="py-16 items-center gap-3">
            <ActivityIndicator size="large" color={palette.orange} />
            <Text className="font-body text-ink-muted">
              Carregando usuários...
            </Text>
          </View>
        ) : error ? (
          <Notice
            error
            message="Não foi possível carregar os usuários. Tente novamente em instantes."
          />
        ) : visibleUsers.length === 0 ? (
          <View className="bg-white rounded-2xl border border-line p-10 items-center gap-3">
            <Text className="font-heading-bold text-lg text-ink">
              Nenhum usuário encontrado
            </Text>
            <Text className="font-body text-sm text-ink-muted text-center">
              Ajuste a busca ou o filtro de papel.
            </Text>
          </View>
        ) : (
          visibleUsers.map((item) => (
            <UserRow
              key={item.id}
              user={item}
              isSelf={item.id === currentUser?.id}
              busy={busy}
              onChangeRole={(role) => requestRoleChange(item, role)}
              onToggleStatus={() => requestStatusChange(item)}
            />
          ))
        )}
      </ScrollView>

      <Modal
        visible={pending !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPending(null)}
      >
        <View className="flex-1 items-center justify-center bg-denim/50 p-5">
          <View
            accessibilityViewIsModal
            className="w-full max-w-form bg-white rounded-xl p-6 gap-5"
          >
            <Text
              accessibilityRole="header"
              className="font-heading-bold text-xl text-ink"
            >
              {pending?.title}
            </Text>
            <Text className="font-body text-base text-ink-muted">
              {pending?.message}
            </Text>
            <TextButton label="Cancelar" onPress={() => setPending(null)} />
            <TextButton label={pending?.confirmLabel ?? 'Confirmar'} onPress={confirm} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
