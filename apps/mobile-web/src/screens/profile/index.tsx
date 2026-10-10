import { useAuth } from '@/hooks/useAuth';
import { colors, palette } from '@/theme';
import { generatePlaceholder } from '@/utils/placeholder';
import { Image, ScrollView, View, Text } from 'react-native';
import { UnauthorizedScreen } from '@/screens/unauthorized';
import { FavoritedAnimal, UserRoleEnum } from '@kapa/shared';
import { useUserProfile } from '@/hooks/useUserProfile';
import { GearIcon, HandHeartIcon, SignOutIcon, UserIcon } from 'phosphor-react-native';
import { PrimaryMenuItem } from '@/components/menuItems/primary';
import { PetCard } from '@/components/cards/pet';
import ProfileBlob from '@/../assets/profile-blob.svg'

const mockFavorited: FavoritedAnimal[] = [
  {
    id: 'eqewq',
    name: 'Gilda',
    photo:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVc2eHkzKA26dGfeGx7aTgRLX7bYAGfmcEbwvEyWNp5w&s=10',
    characteristics: ['Filhote', 'Fêmea'],
  },
];

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
        <ProfileBlob className='absolute top-0 right-0' />
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
        />
        <PrimaryMenuItem
          label="Minhas Doações"
          icon={HandHeartIcon}
          iconColor={colors.onSecondaryContainer}
          iconBgColor={colors.secondaryContainer}
        />
        <PrimaryMenuItem
          label="Ajustes"
          icon={GearIcon}
          iconColor={'#79716B'}
          iconBgColor={'#D6D3D1'}
        />
        <PrimaryMenuItem
          label="Sair"
          icon={SignOutIcon}
          isDestructive
          onPress={() => { void signOut(); }}
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
          {mockFavorited.map((pet) => (
            <PetCard
              key={pet.id}
              name={pet.name}
              imgUrl={pet.photo}
              characteristics={pet.characteristics}
              isFavorited
            />
          ))}
        </View>
      </View>

      <View className="w-full md:w-1/2 md:mx-auto p-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="font-heading font-bold text-denim text-xl">
            Atividade Recente
          </Text>
          <Text className="font-heading font-medium text-orange text-base hover:underline cursor-pointer">
            Ver todos
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
