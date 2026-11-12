import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { XIcon } from 'phosphor-react-native';
import type { User, UserRole } from '@kapa/shared';
import {
  ChoiceGroup,
  Notice,
  TextButton,
} from '@/screens/animalManagement/components';
import { palette } from '@/theme';
import {
  ROLE_LABELS,
  ROLE_ORDER,
  formatDate,
  initialsOf,
} from './model';

const AVATAR_SIZES = { md: 'w-12 h-12', lg: 'w-16 h-16' } as const;

export function UserAvatar({
  user,
  size = 'md',
}: {
  user: User;
  size?: keyof typeof AVATAR_SIZES;
}) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(user.avatar) && !failed;

  return (
    <View
      className={`${AVATAR_SIZES[size]} rounded-full bg-peach items-center justify-center overflow-hidden`}
    >
      {showPhoto ? (
        <Image
          source={{ uri: user.avatar as string }}
          onError={() => setFailed(true)}
          accessibilityLabel={`Foto de ${user.username}`}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      ) : (
        <Text className="font-heading-bold text-base text-denim">
          {initialsOf(user.username)}
        </Text>
      )}
    </View>
  );
}

export function RoleBadge({ role }: { role: UserRole }) {
  const tone = role === 'admin' ? 'bg-denim text-white' : 'bg-peach text-denim';

  return (
    <Text
      className={`self-start rounded-full px-3 py-2 font-body-medium text-xs ${tone}`}
    >
      {ROLE_LABELS[role]}
    </Text>
  );
}

export function UserStatusBadge({ active }: { active: boolean }) {
  return (
    <Text
      className={`self-start rounded-full px-3 py-2 font-body-medium text-xs ${
        active ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
      }`}
    >
      {active ? 'Ativo' : 'Desativado'}
    </Text>
  );
}

interface ManageUserModalProps {
  user: User;
  isSelf: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSaveRole: (role: UserRole) => void;
  onSetActive: (active: boolean) => void;
}

const ROLE_OPTIONS = ROLE_ORDER.map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));

export function ManageUserModal({
  user,
  isSelf,
  busy,
  error,
  onClose,
  onSaveRole,
  onSetActive,
}: ManageUserModalProps) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [confirming, setConfirming] = useState(false);
  const active = !user.deactivatedAt;
  const locked = isSelf || busy;
  const saveDisabled = locked || role === user.role;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-denim/50 p-5">
        <View
          accessibilityViewIsModal
          className="w-full max-w-form max-h-full bg-white rounded-xl"
        >
          <ScrollView contentContainerClassName="p-6 gap-6">
            <View className="flex-row items-start gap-4">
              <UserAvatar user={user} size="lg" />
              <View className="flex-1 gap-1">
                <Text
                  accessibilityRole="header"
                  className="font-heading-bold text-xl text-ink"
                >
                  {user.username}
                </Text>
                <Text className="font-body text-sm text-ink-muted">
                  {user.email}
                </Text>
                <Text className="font-body text-xs text-ink-muted">
                  Cadastro em {formatDate(user.createdAt)}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                onPress={onClose}
                className="w-12 h-12 items-center justify-center rounded-md hover:bg-cream"
              >
                <XIcon size={22} color={palette.denim} />
              </Pressable>
            </View>

            <View className="flex-row flex-wrap gap-2">
              <RoleBadge role={user.role} />
              <UserStatusBadge active={active} />
            </View>

            {isSelf ? (
              <Text className="font-body text-sm text-ink-muted">
                Você não pode alterar a sua própria conta por aqui.
              </Text>
            ) : null}

            <View className="gap-4">
              <ChoiceGroup
                label="Papel"
                value={role}
                options={ROLE_OPTIONS}
                onChange={setRole}
                disabled={locked}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Salvar papel"
                accessibilityState={{ disabled: saveDisabled, busy }}
                disabled={saveDisabled}
                onPress={() => onSaveRole(role)}
                className={`min-h-12 self-start px-6 py-3 rounded-md items-center justify-center bg-orange ${
                  saveDisabled ? 'opacity-40' : 'hover:bg-orange-dark active:bg-orange-dark'
                }`}
              >
                <Text className="font-body-medium text-sm text-ink">
                  {busy ? 'Salvando…' : 'Salvar papel'}
                </Text>
              </Pressable>
            </View>

            <View className="gap-3 pt-5 border-t border-border">
              <Text className="font-body-medium text-sm text-ink">Acesso</Text>
              <Text className="font-body text-sm text-ink-muted">
                {active
                  ? 'Ao desativar, a pessoa não consegue mais entrar no Kapa. Os dados da conta são mantidos e você pode reativar quando quiser.'
                  : 'Esta conta está desativada e não consegue entrar no Kapa.'}
              </Text>
              {!active ? (
                <TextButton
                  label="Reativar conta"
                  disabled={locked}
                  onPress={() => onSetActive(true)}
                />
              ) : confirming ? (
                <View className="gap-3">
                  <Text
                    accessibilityLiveRegion="polite"
                    className="font-body-medium text-sm text-danger"
                  >
                    Confirma desativar a conta de {user.username}?
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Confirmar desativação"
                    accessibilityState={{ disabled: locked }}
                    disabled={locked}
                    onPress={() => onSetActive(false)}
                    className={`min-h-12 px-4 py-3 rounded-md items-center justify-center bg-danger ${
                      locked ? 'opacity-40' : ''
                    }`}
                  >
                    <Text className="font-body-medium text-sm text-white">
                      Confirmar desativação
                    </Text>
                  </Pressable>
                  <TextButton label="Voltar" onPress={() => setConfirming(false)} />
                </View>
              ) : (
                <TextButton
                  label="Desativar conta"
                  disabled={locked}
                  onPress={() => setConfirming(true)}
                />
              )}
            </View>

            {error ? <Notice error message={error} /> : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
