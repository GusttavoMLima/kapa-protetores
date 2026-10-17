import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { ArrowLeftIcon, PawPrintIcon } from 'phosphor-react-native';
import { isAxiosError } from 'axios';
import { router } from 'expo-router';
import type { Animal } from '@kapa/shared';
import { palette } from '@/theme';
import {
  SearchAdoptForm,
  defaultSearchAdoptFilters,
  useSearchAdopt,
  type SearchAdoptFilters,
} from '@/components/forms/searchAdopt';
import { PetCard } from '@/components/cards/pet';
import { PrimaryButton } from '@/components/buttons/primary';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToggleFavorite } from '@/hooks/useFavorites';

const DEFAULT_PET_PHOTO =
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80';

function formatPetCharacteristics(animal: Animal): string[] {
  const characteristics: string[] = [];

  characteristics.push(animal.gender === 'female' ? 'Fêmea' : 'Macho');

  if (animal.size <= 2) {
    characteristics.push('Porte Pequeno');
  } else if (animal.size === 3) {
    characteristics.push('Porte Médio');
  } else {
    characteristics.push('Porte Grande');
  }

  if (typeof animal.age === 'number') {
    if (animal.age === 0) {
      characteristics.push('Filhote');
    } else if (animal.age === 1) {
      characteristics.push('1 ano');
    } else {
      characteristics.push(`${animal.age} anos`);
    }
  }

  return characteristics;
}

export function AdoptScreen() {
  const [filters, setFilters] = useState<SearchAdoptFilters>(
    defaultSearchAdoptFilters,
  );
  const { data: profile } = useUserProfile();
  const { mutate: toggleFavorite } = useToggleFavorite();
  const favoritedIds = useMemo(
    () => new Set(profile?.favorites.map((favorite) => favorite.animalId) ?? []),
    [profile?.favorites],
  );

  const {
    filteredAnimals,
    animals: allAnimals,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useSearchAdopt(filters);

  const errorMessage = useMemo(() => {
    if (!error) return null;
    if (isAxiosError<{ message?: string; error?: string }>(error)) {
      return (
        error.response?.data?.message ??
        error.response?.data?.error ??
        error.message
      );
    }
    return (
      error.message ||
      'Não foi possível carregar os animais para adoção. Verifique sua conexão e tente novamente.'
    );
  }, [error]);

  const handleToggleFavorite = useCallback((id: string) => {
    toggleFavorite(id);
  }, [toggleFavorite]);

  const handleSearch = useCallback((newFilters: SearchAdoptFilters) => {
    setFilters(newFilters);
  }, []);

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: palette.cream }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          tintColor={palette.orange}
          colors={[palette.orange]}
        />
      }
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar para o início"
        className="min-h-10 self-start flex-row items-center gap-2 py-2 pr-4"
        onPress={() => router.replace('/(protected)/(tabs)')}
      >
        <ArrowLeftIcon size={18} color={palette.denim} />
        <Text className="font-body-medium text-sm text-denim">Voltar ao início</Text>
      </Pressable>
      <SearchAdoptForm onSearch={handleSearch} initialFilters={filters} />

      <View className="flex-row items-center justify-between border-t border-line pt-4">
        <Text className="font-heading-bold text-lg text-ink">
          {isLoading
            ? 'Buscando amigos...'
            : `${filteredAnimals.length} ${
                filteredAnimals.length === 1
                  ? 'pet disponível'
                  : 'pets disponíveis'
              }`}
        </Text>
      </View>

      {isLoading ? (
        <View className="py-16 items-center justify-center gap-3">
          <ActivityIndicator size="large" color={palette.orange} />
          <Text className="font-body text-sm text-ink-muted">
            Carregando animais para adoção...
          </Text>
        </View>
      ) : errorMessage ? (
        <View className="p-6 bg-white border border-danger-soft rounded-2xl items-center gap-3">
          <Text className="font-heading-bold text-base text-danger text-center">
            Erro ao carregar lista de pets
          </Text>
          <Text className="font-body text-sm text-ink-muted text-center max-w-sm">
            {errorMessage}
          </Text>
          <View className="w-48 mt-2">
            <PrimaryButton
              title="Tentar novamente"
              onPress={() => void refetch()}
              size="sm"
            />
          </View>
        </View>
      ) : filteredAnimals.length === 0 ? (
        <View className="py-16 px-4 bg-white border border-line rounded-2xl items-center justify-center gap-3">
          <PawPrintIcon size={44} color={palette.denim} weight="duotone" />
          <Text className="font-heading-bold text-base text-ink text-center">
            {allAnimals.length === 0
              ? 'Nenhum animal disponível no momento'
              : 'Nenhum animal encontrado'}
          </Text>
          <Text className="font-body text-sm text-ink-muted text-center max-w-xs">
            {allAnimals.length === 0
              ? 'Não há animais marcados para adoção no abrigo no momento. Volte em breve!'
              : 'Tente alterar os termos da busca ou limpar os filtros para ver mais bichinhos.'}
          </Text>
          {allAnimals.length > 0 && (
            <Pressable
              onPress={() => setFilters(defaultSearchAdoptFilters)}
              accessibilityRole="button"
              accessibilityLabel="Ver todos os animais"
              className="mt-2 bg-peach px-4 py-2.5 rounded-full active:opacity-80"
            >
              <Text className="font-body-medium text-sm text-denim">
                Ver todos os pets
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View className="flex-row flex-wrap items-center justify-center gap-4">
          {filteredAnimals.map((animal) => (
            <PetCard
              key={animal.id}
              name={animal.name}
              imgUrl={animal.photos?.[0]?.photoUrl ?? DEFAULT_PET_PHOTO}
              characteristics={formatPetCharacteristics(animal)}
              isFavorited={favoritedIds.has(animal.id)}
              onPress={() =>
                router.push({
                  pathname: '/adopet/[id]',
                  params: { id: animal.id },
                })
              }
              onToggleFavorite={() => handleToggleFavorite(animal.id)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
