import { useAuth } from '@/hooks/useAuth';
import { palette } from '@/theme';
import { generatePlaceholder } from '@/utils/placeholder';
import { Image, Pressable, ScrollView, View, Text } from 'react-native';
import { router } from 'expo-router';
import { UnauthorizedScreen } from '@/screens/unauthorized';
import { SystemEventTypes, UserRoleEnum, type SystemEvent } from '@kapa/shared';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  SignOutIcon,
  UserIcon,
  ClipboardTextIcon,
  HeartIcon,
  PawPrintIcon,
  CalendarCheckIcon,
} from 'phosphor-react-native';
import { PrimaryMenuItem } from '@/components/menuItems/primary';
import { PetCard } from '@/components/cards/pet';
import ProfileBlob from '@/../assets/profile-blob.svg';

function formatEventLabel(event: SystemEvent): {
  title: string;
  subtitle: string;
} {
  const payload =
    event.payload && typeof event.payload === 'object'
      ? (event.payload as Record<string, unknown>)
      : {};
  const animalName =
    typeof payload.animalName === 'string' ? payload.animalName : undefined;
  const eventTitle =
    typeof payload.eventTitle === 'string' ? payload.eventTitle : undefined;

  switch (event.type) {
    case SystemEventTypes.ADOPTION_REQUESTED:
      return {
        title: 'Solicitação de adoção enviada',
        subtitle: animalName
          ? `Ficha enviada para adotar ${animalName}`
          : 'Você enviou uma nova ficha de adoção',
      };
    case SystemEventTypes.ADOPTION_APPROVED:
      return {
        title: 'Adoção aprovada!',
        subtitle: animalName
          ? `Sua solicitação para ${animalName} foi aprovada`
          : 'Sua solicitação de adoção foi aprovada',
      };
    case SystemEventTypes.ADOPTION_REJECTED:
      return {
        title: 'Solicitação de adoção atualizada',
        subtitle: 'Confira os detalhes em Minhas solicitações',
      };
    case SystemEventTypes.ADOPTION_CANCELED:
      return {
        title: 'Solicitação de adoção cancelada',
        subtitle: 'O processo de adoção foi encerrado',
      };
    case SystemEventTypes.PET_FAVORITED:
      return {
        title: 'Pet favoritado',
        subtitle: animalName
          ? `${animalName} foi adicionado aos seus favoritos`
          : 'Você adicionou um pet aos favoritos',
      };
    case SystemEventTypes.PET_UNFAVORITED:
      return {
        title: 'Pet removido dos favoritos',
        subtitle: animalName
          ? `${animalName} foi removido dos seus favoritos`
          : 'Você removeu um pet dos favoritos',
      };
    case SystemEventTypes.VOLUNTEER_REGISTERED:
      return {
        title: 'Inscrição em atividade voluntária',
        subtitle: eventTitle
          ? `Inscrito em: ${eventTitle}`
          : 'Você se inscreveu em uma atividade do abrigo',
      };
    case SystemEventTypes.VOLUNTEER_APPLICATION_SUBMITTED:
      return {
        title: 'Solicitação de voluntariado enviada',
        subtitle: 'Sua ficha de voluntariado está em análise pelo abrigo',
      };
    case SystemEventTypes.VOLUNTEER_APPLICATION_APPROVED:
      return {
        title: 'Voluntariado aprovado!',
        subtitle:
          'Seu acesso às atividades semanais de voluntariado foi liberado',
      };
    case SystemEventTypes.VOLUNTEER_APPLICATION_REJECTED:
      return {
        title: 'Solicitação de voluntariado atualizada',
        subtitle: 'Confira os detalhes na tela de Voluntariado',
      };
    case SystemEventTypes.ANIMAL_CREATED:
      return {
        title: 'Animal cadastrado no abrigo',
        subtitle: animalName
          ? `Cadastro de ${animalName}`
          : 'Novo animal registrado',
      };
    case SystemEventTypes.ANIMAL_STATUS_UPDATED:
      return {
        title: 'Status de animal atualizado',
        subtitle: 'O acompanhamento do animal foi atualizado',
      };
    case SystemEventTypes.USER_REGISTERED:
      return {
        title: 'Conta criada no Kapa',
        subtitle: 'Bem-vindo(a) à nossa comunidade de proteção animal',
      };
    default:
      return {
        title: 'Atividade registrada',
        subtitle: String(event.type),
      };
  }
}

function formatEventDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function ProfileScreen() {
  const { user, isLogged, signOut } = useAuth();
  const { data } = useUserProfile();

  if (!isLogged || !user) return <UnauthorizedScreen />;

  const initials = (user.username?.trim().slice(0, 2) || 'KP').toUpperCase();
  const avatarUri =
    user.avatar ||
    generatePlaceholder(
      palette.cream,
      palette.orange,
      300,
      300,
      initials,
      'Montserrat',
    );

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}
      showsVerticalScrollIndicator={false}
      className="flex-1 bg-cream"
    >
      <View className="items-center mt-[1.5rem] bg-[#F6F3EE] p-8 w-full relative">
        <ProfileBlob className="absolute top-0 right-0" />
        <Image
          source={{ uri: avatarUri }}
          className="w-[7.5rem] h-[7.5rem] rounded-full border-[.3rem] border-orange bg-peach z-20"
          resizeMode="cover"
        />
        <Text className="mt-4 text-lg font-heading-bold text-ink">
          {user.username}
        </Text>
        <Text className="mt-2 text-sm font-body-medium text-ink-muted">
          {UserRoleEnum[user.role] || 'Adotador'}
        </Text>
        <View className="mt-8 flex flex-row items-center gap-4">
          <Text className="text-center uppercase font-body-medium">
            <Text className="text-orange-dark font-bold text-xl">
              {data?.counts.favorites ?? 0}
            </Text>{' '}
            {'\n'} Favoritos
          </Text>
          <Text className="text-center uppercase font-body-medium">
            <Text className="text-denim font-bold text-xl">
              {data?.counts.adoptions ?? 0}
            </Text>{' '}
            {'\n'} Processos
          </Text>
        </View>
      </View>

      <View className="w-full gap-2 p-4 sm:p-6 md:w-1/2 md:mx-auto">
        <PrimaryMenuItem
          label="Editar Perfil"
          icon={UserIcon}
          iconColor={palette.orangeDark}
          onPress={() => router.push('/(protected)/(adopter)/edit-profile')}
        />
        {user.role !== 'admin' && user.role !== 'protector' && (
          <PrimaryMenuItem
            label="Minhas solicitações"
            description="Acompanhe suas fichas de adoção"
            icon={ClipboardTextIcon}
            iconColor={palette.denim}
            iconBgColor="#E4EEFA"
            onPress={() => router.push('/(protected)/my-adoptions')}
          />
        )}
        <PrimaryMenuItem
          label="Sair"
          icon={SignOutIcon}
          isDestructive
          onPress={() => {
            void signOut();
          }}
        />
      </View>

      <View className="w-full md:w-1/2 md:mx-auto p-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="font-heading font-bold text-denim text-xl">
            Meus Favoritos
          </Text>
          <Text className="font-heading font-medium text-orange text-base hover:underline cursor-pointer">
            Ver todos
          </Text>
        </View>

        <View className="w-full overflow-hidden gap-2 p-2">
          {data?.favorites.length ? (
            data.favorites.map((favorite) =>
              favorite.animal ? (
                <PetCard
                  key={favorite.animalId}
                  name={favorite.animal.name}
                  imgUrl={
                    favorite.animal.photo ??
                    generatePlaceholder(
                      palette.peach,
                      palette.orange,
                      300,
                      300,
                      favorite.animal.name.slice(0, 2),
                      'Montserrat',
                    )
                  }
                  characteristics={[
                    favorite.animal.gender === 'female' ? 'Fêmea' : 'Macho',
                    `${favorite.animal.age} ${favorite.animal.age === 1 ? 'ano' : 'anos'}`,
                  ]}
                  isFavorited
                />
              ) : null,
            )
          ) : (
            <Text className="font-body text-sm text-ink-muted">
              Você ainda não favoritou nenhum pet.
            </Text>
          )}
        </View>
      </View>

      <View className="w-full md:w-1/2 md:mx-auto p-4 pb-10">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="font-heading font-bold text-denim text-xl">
            Atividade Recente
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver todas as atividades"
            onPress={() => router.push('/(protected)/my-events')}
          >
            <Text className="font-heading font-medium text-orange text-base hover:underline cursor-pointer">
              Ver todos
            </Text>
          </Pressable>
        </View>

        <View className="w-full gap-3">
          {data?.events.length ? (
            data.events.slice(0, 5).map((event) => {
              const { title, subtitle } = formatEventLabel(event);
              const isFavoriteEvent =
                event.type === SystemEventTypes.PET_FAVORITED ||
                event.type === SystemEventTypes.PET_UNFAVORITED;
              const isVolunteerEvent =
                event.type === SystemEventTypes.VOLUNTEER_REGISTERED;

              return (
                <View
                  key={event.id}
                  className="flex-row items-center gap-3.5 rounded-2xl border border-line bg-white p-4"
                >
                  <View className="size-10 rounded-full bg-peach items-center justify-center">
                    {isFavoriteEvent ? (
                      <HeartIcon
                        size={20}
                        color={palette.orange}
                        weight="fill"
                      />
                    ) : isVolunteerEvent ? (
                      <CalendarCheckIcon
                        size={20}
                        color={palette.denim}
                        weight="fill"
                      />
                    ) : (
                      <PawPrintIcon
                        size={20}
                        color={palette.denim}
                        weight="fill"
                      />
                    )}
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="font-heading-bold text-sm text-ink">
                      {title}
                    </Text>
                    <Text className="font-body text-xs text-ink-muted">
                      {subtitle}
                    </Text>
                  </View>
                  <Text className="font-body text-xs text-ink-muted">
                    {formatEventDate(event.emittedAt)}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text className="font-body text-sm text-ink-muted">
              Nenhuma atividade recente registrada.
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
