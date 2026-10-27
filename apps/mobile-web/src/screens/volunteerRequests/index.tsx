import { Redirect, router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { ArrowLeftIcon, HandHeartIcon } from 'phosphor-react-native';
import { useAuth } from '@/hooks/useAuth';
import {
  useAdminVolunteerApplications,
  useUpdateVolunteerApplicationStatus,
} from '@/hooks/useVolunteerApplications';
import { PrimaryButton } from '@/components/buttons/primary';
import {
  VOLUNTEER_AREA_LABELS,
  VOLUNTEER_AVAILABILITY_LABELS,
} from '@/screens/volunteer';
import { palette } from '@/theme';

export function VolunteerRequestsScreen() {
  const { user } = useAuth();
  const {
    data: applications = [],
    isLoading,
    error,
  } = useAdminVolunteerApplications();
  const { mutate: updateStatus, isPending } =
    useUpdateVolunteerApplicationStatus();

  if (user?.role !== 'admin' && user?.role !== 'protector') {
    return <Redirect href="/(protected)/(tabs)" />;
  }

  return (
    <ScrollView
      className="flex-1 bg-cream"
      contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 20 }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        className="min-h-12 self-start flex-row items-center gap-2 py-2 pr-4"
        onPress={() =>
          router.canGoBack()
            ? router.back()
            : router.replace('/(protected)/(tabs)')
        }
      >
        <ArrowLeftIcon size={18} color={palette.denim} />
        <Text className="font-body-medium text-sm text-denim">Voltar</Text>
      </Pressable>

      <View className="items-center bg-white rounded-2xl border border-line px-5 py-6 gap-2">
        <View className="w-12 h-12 rounded-full bg-peach items-center justify-center">
          <HandHeartIcon size={26} color={palette.orange} weight="fill" />
        </View>
        <Text className="font-heading-bold text-3xl text-ink text-center">
          Candidaturas de voluntários
        </Text>
        <Text className="font-body text-base text-ink-muted text-center">
          Analise as fichas enviadas e aprove novos voluntários para as
          atividades semanais.
        </Text>
      </View>

      {isLoading ? (
        <View className="py-16 items-center gap-3">
          <ActivityIndicator size="large" color={palette.orange} />
          <Text className="font-body text-ink-muted">
            Carregando candidaturas...
          </Text>
        </View>
      ) : error ? (
        <View className="bg-white rounded-2xl border border-danger-soft p-5">
          <Text className="font-body-medium text-danger">
            Não foi possível carregar as solicitações de voluntariado.
          </Text>
        </View>
      ) : applications.length === 0 ? (
        <View className="bg-white rounded-2xl border border-line p-10 items-center gap-3">
          <HandHeartIcon size={44} color={palette.denim} />
          <Text className="font-heading-bold text-lg text-ink">
            Nenhuma inscrição recebida ainda
          </Text>
          <Text className="font-body text-sm text-ink-muted text-center">
            Quando alguém enviar o formulário para ser voluntário, a ficha
            aparecerá aqui.
          </Text>
        </View>
      ) : (
        applications.map((item) => {
          const statusLabel =
            item.status === 'approved'
              ? 'Aprovado'
              : item.status === 'rejected'
                ? 'Recusado'
                : 'Pendente';
          const statusClass =
            item.status === 'approved'
              ? 'bg-success-soft text-success'
              : item.status === 'rejected'
                ? 'bg-danger-soft text-danger'
                : 'bg-peach text-orange-dark';

          return (
            <View
              key={item.id}
              className="bg-white rounded-2xl border border-line p-6 gap-5"
            >
              <View className="flex-row items-start justify-between gap-4">
                <View className="gap-1 flex-1">
                  <Text className="font-heading-bold text-xl text-ink">
                    {item.application.fullName}
                  </Text>
                  {item.user?.email ? (
                    <Text className="font-body text-sm text-ink-muted">
                      {item.user.email}
                    </Text>
                  ) : null}
                </View>
                <Text
                  className={`font-body-bold text-xs px-3 py-2 rounded-full ${statusClass}`}
                >
                  {statusLabel}
                </Text>
              </View>

              <View className="bg-cream rounded-xl p-4 gap-1">
                <Text className="font-body-bold text-sm text-denim">
                  Contato e disponibilidade
                </Text>
                <Text className="font-body text-sm text-ink">
                  Telefone: {item.application.phone}
                </Text>
                <Text className="font-body text-sm text-ink-muted">
                  Disponibilidade:{' '}
                  {
                    VOLUNTEER_AVAILABILITY_LABELS[
                      item.application.availability
                    ]
                  }
                </Text>
              </View>

              <View className="gap-2">
                <Text className="font-body-bold text-sm text-ink">
                  Áreas de interesse
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {item.application.areasOfInterest.map((area) => (
                    <View
                      key={area}
                      className="rounded-full bg-peach px-3 py-1"
                    >
                      <Text className="font-body-medium text-xs text-denim">
                        {VOLUNTEER_AREA_LABELS[area]}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className="bg-cream rounded-xl p-4 gap-1">
                <Text className="font-body-bold text-sm text-ink">
                  Motivação
                </Text>
                <Text className="font-body text-sm text-ink-muted">
                  {item.application.motivation}
                </Text>
              </View>

              {item.status === 'pending' ? (
                <View className="gap-3">
                  <PrimaryButton
                    title="Aprovar voluntário"
                    loading={isPending}
                    onPress={() =>
                      updateStatus({ id: item.id, status: 'approved' })
                    }
                  />
                  <Pressable
                    className="w-full min-h-[52px] rounded-lg items-center justify-center bg-danger"
                    style={({ pressed }) => [
                      { backgroundColor: pressed ? '#8B1111' : '#BA1A1A' },
                      isPending ? { opacity: 0.55 } : null,
                    ]}
                    disabled={isPending}
                    accessibilityRole="button"
                    accessibilityLabel="Recusar candidatura"
                    onPress={() =>
                      updateStatus({ id: item.id, status: 'rejected' })
                    }
                  >
                    <Text className="font-bold text-base text-white">
                      Recusar candidatura
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
