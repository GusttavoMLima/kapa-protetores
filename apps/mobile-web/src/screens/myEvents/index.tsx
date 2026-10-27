import { useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  ArrowLeftIcon,
  CalendarCheckIcon,
  ClockCounterClockwiseIcon,
  HeartIcon,
  PawPrintIcon,
} from 'phosphor-react-native';
import { SystemEventTypes, type SystemEvent } from '@kapa/shared';
import { useUserEvents } from '@/hooks/useUserEvents';
import { palette } from '@/theme';

const EVENT_FILTER_OPTIONS: readonly {
  label: string;
  value: SystemEventTypes | undefined;
}[] = [
  { label: 'Todas', value: undefined },
  {
    label: 'Adoções solicitadas',
    value: SystemEventTypes.ADOPTION_REQUESTED,
  },
  {
    label: 'Adoções aprovadas',
    value: SystemEventTypes.ADOPTION_APPROVED,
  },
  { label: 'Pets favoritados', value: SystemEventTypes.PET_FAVORITED },
  { label: 'Voluntariado', value: SystemEventTypes.VOLUNTEER_REGISTERED },
];

export function formatSystemEventDetails(event: SystemEvent): {
  title: string;
  subtitle: string;
  badge: string;
} {
  const payload =
    event.payload && typeof event.payload === 'object'
      ? (event.payload as Record<string, unknown>)
      : {};
  const animalName =
    typeof payload.animalName === 'string' ? payload.animalName : undefined;
  const eventTitle =
    typeof payload.eventTitle === 'string' ? payload.eventTitle : undefined;
  const reason =
    typeof payload.reason === 'string' ? payload.reason : undefined;

  switch (event.type) {
    case SystemEventTypes.ADOPTION_REQUESTED:
      return {
        title: 'Solicitação de adoção enviada',
        subtitle: animalName
          ? `Ficha enviada para adotar ${animalName}.`
          : 'Você enviou uma nova ficha de adoção.',
        badge: 'Adoção',
      };
    case SystemEventTypes.ADOPTION_APPROVED:
      return {
        title: 'Adoção aprovada!',
        subtitle: animalName
          ? `Sua solicitação para adotar ${animalName} foi aprovada.`
          : 'Sua solicitação de adoção foi aprovada pelo abrigo.',
        badge: 'Adoção',
      };
    case SystemEventTypes.ADOPTION_REJECTED:
      return {
        title: 'Solicitação de adoção não aprovada',
        subtitle: reason
          ? `Motivo informado: ${reason}`
          : 'Confira mais detalhes em Minhas solicitações.',
        badge: 'Adoção',
      };
    case SystemEventTypes.ADOPTION_CANCELED:
      return {
        title: 'Solicitação de adoção cancelada',
        subtitle: 'O processo de adoção foi encerrado.',
        badge: 'Adoção',
      };
    case SystemEventTypes.PET_FAVORITED:
      return {
        title: 'Pet favoritado',
        subtitle: animalName
          ? `${animalName} foi adicionado aos seus favoritos.`
          : 'Você adicionou um pet à sua lista de favoritos.',
        badge: 'Favoritos',
      };
    case SystemEventTypes.PET_UNFAVORITED:
      return {
        title: 'Pet removido dos favoritos',
        subtitle: animalName
          ? `${animalName} foi removido dos seus favoritos.`
          : 'Você removeu um pet da sua lista de favoritos.',
        badge: 'Favoritos',
      };
    case SystemEventTypes.VOLUNTEER_REGISTERED:
      return {
        title: 'Inscrição em atividade voluntária',
        subtitle: eventTitle
          ? `Você se inscreveu na atividade "${eventTitle}".`
          : 'Você se inscreveu em uma atividade do abrigo.',
        badge: 'Voluntariado',
      };
    case SystemEventTypes.VOLUNTEER_APPLICATION_SUBMITTED:
      return {
        title: 'Solicitação de voluntariado enviada',
        subtitle:
          'Você enviou uma ficha para atuar como voluntário(a) no abrigo.',
        badge: 'Voluntariado',
      };
    case SystemEventTypes.VOLUNTEER_APPLICATION_APPROVED:
      return {
        title: 'Voluntariado aprovado!',
        subtitle:
          'Sua candidatura foi aprovada e seu acesso às atividades semanais foi liberado.',
        badge: 'Voluntariado',
      };
    case SystemEventTypes.VOLUNTEER_APPLICATION_REJECTED:
      return {
        title: 'Solicitação de voluntariado não aprovada',
        subtitle: reason
          ? `Motivo informado: ${reason}`
          : 'Confira mais detalhes na área de Voluntariado.',
        badge: 'Voluntariado',
      };
    case SystemEventTypes.ANIMAL_CREATED:
      return {
        title: 'Animal cadastrado no abrigo',
        subtitle: animalName
          ? `Cadastro realizado para ${animalName}.`
          : 'Novo animal registrado no sistema.',
        badge: 'Abrigo',
      };
    case SystemEventTypes.ANIMAL_STATUS_UPDATED:
      return {
        title: 'Status de animal atualizado',
        subtitle: 'O acompanhamento do animal foi atualizado no abrigo.',
        badge: 'Abrigo',
      };
    case SystemEventTypes.USER_REGISTERED:
      return {
        title: 'Conta criada no Kapa',
        subtitle: 'Bem-vindo(a) à nossa comunidade de proteção animal.',
        badge: 'Conta',
      };
    default:
      return {
        title: 'Atividade registrada',
        subtitle: String(event.type),
        badge: 'Sistema',
      };
  }
}

export function formatEventDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const datePart = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart} às ${timePart}`;
}

export function MyEventsScreen() {
  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState<
    SystemEventTypes | undefined
  >(undefined);
  const limit = 10;

  const { data, isLoading, isRefetching, error, refetch } = useUserEvents({
    page,
    limit,
    type: selectedType,
  });

  const events = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <ScrollView
      className="flex-1 bg-cream"
      contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          tintColor={palette.orange}
          colors={[palette.orange]}
        />
      }
    >
      <View className="w-full max-w-content self-center gap-5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar para o perfil"
          className="min-h-10 self-start flex-row items-center gap-2 py-2 pr-4"
          onPress={() => router.replace('/(protected)/(tabs)/profile')}
        >
          <ArrowLeftIcon size={18} color={palette.denim} />
          <Text className="font-body-medium text-sm text-denim">
            Voltar ao perfil
          </Text>
        </Pressable>

        <View className="items-center bg-white rounded-2xl border border-line px-5 py-6 gap-2">
          <View className="w-12 h-12 rounded-full bg-peach items-center justify-center">
            <ClockCounterClockwiseIcon
              size={26}
              color={palette.orange}
              weight="bold"
            />
          </View>
          <Text
            accessibilityRole="header"
            className="font-heading-bold text-3xl text-ink text-center"
          >
            Minhas atividades
          </Text>
          <Text className="font-body text-base text-ink-muted text-center">
            Acompanhe todo o seu histórico de ações e interações no Kapa.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          accessibilityLabel="Filtrar por tipo de atividade"
        >
          {EVENT_FILTER_OPTIONS.map((option) => {
            const isSelected = selectedType === option.value;
            return (
              <Pressable
                key={option.label}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Filtrar por ${option.label}`}
                onPress={() => {
                  setSelectedType(option.value);
                  setPage(1);
                }}
                className={`min-h-11 px-4 py-2.5 rounded-full border items-center justify-center ${
                  isSelected
                    ? 'bg-denim border-denim'
                    : 'bg-white border-line active:bg-peach'
                }`}
              >
                <Text
                  className={`font-body-medium text-xs ${
                    isSelected ? 'text-white' : 'text-denim'
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View className="py-16 items-center gap-3">
            <ActivityIndicator size="large" color={palette.orange} />
            <Text className="font-body text-ink-muted">
              Carregando histórico de atividades...
            </Text>
          </View>
        ) : error ? (
          <View className="bg-white rounded-2xl border border-danger-soft p-6 items-center gap-3">
            <Text className="font-heading-bold text-danger text-center">
              Não foi possível carregar suas atividades.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tentar novamente"
              onPress={() => void refetch()}
              className="bg-orange px-5 py-3 rounded-lg"
            >
              <Text className="font-heading-bold text-white">
                Tentar novamente
              </Text>
            </Pressable>
          </View>
        ) : events.length === 0 ? (
          <View className="bg-white rounded-2xl border border-line p-10 items-center gap-3">
            <PawPrintIcon size={44} color={palette.denim} weight="duotone" />
            <Text className="font-heading-bold text-lg text-ink text-center">
              Nenhuma atividade encontrada
            </Text>
            <Text className="font-body text-sm text-ink-muted text-center">
              {selectedType
                ? 'Você ainda não possui registros para este filtro.'
                : 'Suas interações com pets, solicitações e voluntariado aparecerão aqui.'}
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {events.map((event) => {
              const { title, subtitle, badge } =
                formatSystemEventDetails(event);
              const isFavoriteEvent =
                event.type === SystemEventTypes.PET_FAVORITED ||
                event.type === SystemEventTypes.PET_UNFAVORITED;
              const isVolunteerEvent =
                event.type === SystemEventTypes.VOLUNTEER_REGISTERED;

              return (
                <Pressable
                  key={event.id}
                  disabled={!event.animalId}
                  onPress={() => {
                    if (event.animalId) {
                      router.push({
                        pathname: '/adopet/[id]',
                        params: { id: event.animalId },
                      });
                    }
                  }}
                  className="bg-white rounded-2xl border border-line p-4 gap-3 active:opacity-85"
                >
                  <View className="flex-row items-start gap-3.5">
                    <View className="size-11 rounded-full bg-peach items-center justify-center">
                      {isFavoriteEvent ? (
                        <HeartIcon
                          size={22}
                          color={palette.orange}
                          weight="fill"
                        />
                      ) : isVolunteerEvent ? (
                        <CalendarCheckIcon
                          size={22}
                          color={palette.denim}
                          weight="fill"
                        />
                      ) : (
                        <PawPrintIcon
                          size={22}
                          color={palette.denim}
                          weight="fill"
                        />
                      )}
                    </View>

                    <View className="flex-1 gap-1">
                      <View className="flex-row items-center justify-between gap-2 flex-wrap">
                        <Text className="font-heading-bold text-base text-ink">
                          {title}
                        </Text>
                        <View className="rounded-full bg-peach px-2.5 py-0.5">
                          <Text className="font-body-medium text-xs text-denim">
                            {badge}
                          </Text>
                        </View>
                      </View>

                      <Text className="font-body text-sm text-ink-muted">
                        {subtitle}
                      </Text>

                      <Text className="font-body text-xs text-ink-muted mt-1">
                        {formatEventDateTime(event.emittedAt)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}

            <View className="bg-white rounded-2xl border border-line p-4 flex-row items-center justify-between gap-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Página anterior"
                disabled={page <= 1}
                onPress={() => setPage((prev) => Math.max(1, prev - 1))}
                className={`min-h-11 px-4 py-2 rounded-lg border border-line items-center justify-center ${
                  page <= 1 ? 'opacity-40' : 'active:bg-peach'
                }`}
              >
                <Text className="font-body-medium text-sm text-denim">
                  Anterior
                </Text>
              </Pressable>

              <Text className="font-body text-xs text-ink-muted text-center">
                Página {page} de {totalPages} ({total}{' '}
                {total === 1 ? 'registro' : 'registros'})
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Próxima página"
                disabled={page >= totalPages}
                onPress={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                className={`min-h-11 px-4 py-2 rounded-lg border border-line items-center justify-center ${
                  page >= totalPages ? 'opacity-40' : 'active:bg-peach'
                }`}
              >
                <Text className="font-body-medium text-sm text-denim">
                  Próxima
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
