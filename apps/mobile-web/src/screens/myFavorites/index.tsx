import { PrimaryButton } from '@/components/buttons/primary';
import { PetCard } from '@/components/cards/pet';
import { Page } from '@/components/layout/Page';
import { useToggleFavorite } from '@/hooks/useFavorites';
import { useUserProfile } from '@/hooks/useUserProfile';
import { palette } from '@/theme';
import { generatePlaceholder } from '@/utils/placeholder';
import type { FavoriteAnimalSummary } from '@kapa/shared';
import { router } from 'expo-router';
import { HeartIcon, PawPrintIcon } from 'phosphor-react-native';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  Text,
  View,
} from 'react-native';

const PLACEHOLDER_IMAGE_SIZE = 300;

export function formatFavoriteAnimalCharacteristics(
  animal: FavoriteAnimalSummary,
): string[] {
  const genderLabel = animal.gender === 'female' ? 'Fêmea' : 'Macho';

  if (animal.age === 0) return ['Filhote', genderLabel];
  if (animal.age === 1) return ['1 ano', genderLabel];
  return [`${animal.age} anos`, genderLabel];
}

export function resolveFavoriteAnimalImage(
  animal: FavoriteAnimalSummary,
): string {
  if (animal.photo) {
    return animal.photo;
  }

  return generatePlaceholder(
    palette.peach,
    palette.orange,
    PLACEHOLDER_IMAGE_SIZE,
    PLACEHOLDER_IMAGE_SIZE,
    animal.name.slice(0, 2).toUpperCase(),
    'Montserrat',
  );
}

export function MyFavoritesScreen() {
  const { data, isLoading, isRefetching, refetch } = useUserProfile();
  const { mutate: toggleFavorite } = useToggleFavorite();

  const favoritePets = useMemo(
    () =>
      (data?.favorites ?? []).filter(
        (
          favorite,
        ): favorite is typeof favorite & { animal: FavoriteAnimalSummary } =>
          Boolean(favorite.animal),
      ),
    [data?.favorites],
  );

  const handleBack = useCallback(() => {
    if (router.canGoBack?.()) {
      router.back();
    } else {
      router.replace('/(protected)/(tabs)/profile');
    }
  }, []);

  const handleOpenPetDetails = useCallback((animalId: string) => {
    router.push({
      pathname: '/adopet/[id]',
      params: { id: animalId },
    });
  }, []);

  return (
    <Page
      backLabel="Perfil"
      onBack={handleBack}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            void refetch();
          }}
          tintColor={palette.orange}
          colors={[palette.orange]}
        />
      }
    >
      <View className="bg-white border border-line rounded-2xl p-6 shadow-card flex-row items-center justify-between gap-4">
        <View className="flex-1 gap-1.5">
          <View className="bg-peach self-start px-3 py-1 rounded-full flex-row items-center gap-1.5">
            <HeartIcon size={14} color={palette.orange} weight="fill" />
            <Text className="font-body-medium font-bold text-xs text-denim">
              Sua lista de carinho
            </Text>
          </View>
          <Text className="font-heading-bold font-extrabold text-2xl text-ink tracking-tight">
            Meus Favoritos
          </Text>
          <Text className="font-body text-sm text-ink-muted">
            Acompanhe todos os pets que conquistaram o seu coração.
          </Text>
        </View>

        <View className="bg-cream-dark px-4 py-3 rounded-2xl items-center justify-center min-w-[72px]">
          <Text className="font-heading-bold font-extrabold text-xl text-orange-dark">
            {favoritePets.length}
          </Text>
          <Text className="font-body text-xs text-ink-muted">
            {favoritePets.length === 1 ? 'pet' : 'pets'}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="bg-white border border-line rounded-2xl p-10 items-center justify-center gap-3">
          <ActivityIndicator size="large" color={palette.orange} />
          <Text className="font-body text-sm text-ink-muted">
            Carregando seus pets favoritos...
          </Text>
        </View>
      ) : favoritePets.length === 0 ? (
        <View className="bg-white border border-line rounded-2xl p-10 items-center justify-center gap-4">
          <View className="size-14 rounded-full bg-peach items-center justify-center">
            <PawPrintIcon size={28} color={palette.orange} weight="duotone" />
          </View>
          <View className="items-center gap-1 max-w-sm">
            <Text className="font-heading-bold font-bold text-lg text-ink text-center">
              Nenhum pet favoritado ainda
            </Text>
            <Text className="font-body text-sm text-ink-muted text-center">
              Explore a vitrine de adoção e toque no coração dos animais que
              você deseja acompanhar.
            </Text>
          </View>
          <PrimaryButton
            title="Explorar pets para adoção"
            fullWidth={false}
            size="sm"
            onPress={() => router.push('/adopet')}
          />
        </View>
      ) : (
        <View className="flex-row flex-wrap justify-center sm:justify-start gap-5">
          {favoritePets.map((favorite) => (
            <PetCard
              key={favorite.animalId}
              name={favorite.animal.name}
              imgUrl={resolveFavoriteAnimalImage(favorite.animal)}
              characteristics={formatFavoriteAnimalCharacteristics(
                favorite.animal,
              )}
              isFavorited
              onPress={() => handleOpenPetDetails(favorite.animalId)}
              onToggleFavorite={() => toggleFavorite(favorite.animalId)}
            />
          ))}
        </View>
      )}
    </Page>
  );
}
