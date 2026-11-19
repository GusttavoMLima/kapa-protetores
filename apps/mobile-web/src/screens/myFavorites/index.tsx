import { PrimaryButton } from '@/components/buttons/primary';
import { PetCard } from '@/components/cards/pet';
import { Page } from '@/components/layout/Page';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/ListStates';
import { useToggleFavorite } from '@/hooks/useFavorites';
import { useUserProfile } from '@/hooks/useUserProfile';
import { palette } from '@/theme';
import { generatePlaceholder } from '@/utils/placeholder';
import type { FavoriteAnimalSummary } from '@kapa/shared';
import { router } from 'expo-router';
import { HeartIcon, PawPrintIcon } from 'phosphor-react-native';
import { useCallback, useMemo } from 'react';
import {
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
  const { data, isLoading, isRefetching, error, refetch } = useUserProfile();
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
        <LoadingState message="Carregando seus pets favoritos…" />
      ) : error ? (
        <ErrorState
          message="Não foi possível carregar seus favoritos. Verifique sua conexão e tente novamente."
          onRetry={() => void refetch()}
        />
      ) : favoritePets.length === 0 ? (
        <EmptyState
          icon={PawPrintIcon}
          title="Nenhum pet favoritado ainda"
          description="Explore a vitrine de adoção e toque no coração dos animais que você deseja acompanhar."
          action={<PrimaryButton title="Explorar pets para adoção" fullWidth={false} onPress={() => router.push('/adopet')} />}
        />
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
