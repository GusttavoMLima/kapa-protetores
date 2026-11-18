import { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { PawPrintIcon } from 'phosphor-react-native';
import { isAxiosError } from 'axios';
import { router } from 'expo-router';
import type { AdopterProfile, Animal } from '@kapa/shared';
import { palette } from '@/theme';
import {
  SearchAdoptForm,
  defaultSearchAdoptFilters,
  useSearchAdopt,
  type SearchAdoptFilters,
} from '@/components/forms/searchAdopt';
import { PetCard } from '@/components/cards/pet';
import { TextButton } from '@/components/buttons/secondary';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/ListStates';
import { PageHeading } from '@/components/layout/PageHeading';
import { useAdopterProfileMe } from '@/hooks/useAdopterProfile';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToggleFavorite } from '@/hooks/useFavorites';
import {
  calculatePetCompatibility,
  formatCompatibilityLabel,
} from '@/utils/petCompatibility';

function formatPetCharacteristics(
  animal: Animal,
  adopterProfile?: AdopterProfile | null,
): string[] {
  const characteristics: string[] = [];

  const compatibilityScore = calculatePetCompatibility(animal, adopterProfile);
  if (compatibilityScore !== null) {
    characteristics.push(formatCompatibilityLabel(compatibilityScore));
  }

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
  const { data: adopterProfile } = useAdopterProfileMe();
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
    const fallback = 'Não foi possível carregar os animais para adoção. Verifique sua conexão e tente novamente.';
    // Só mensagens do servidor chegam à tela; erros técnicos (ex.: "Network Error") viram o texto padrão.
    return isAxiosError<{ message?: string }>(error) ? error.response?.data?.message ?? fallback : fallback;
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
      contentContainerClassName="w-full max-w-content self-center px-5 md:px-10 pt-3 pb-12 gap-6"
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          tintColor={palette.orange}
          colors={[palette.orange]}
        />
      }
    >
      <PageHeading eyebrow="ENCONTRE SEU NOVO MELHOR AMIGO" title="Um encontro. Uma vida inteira." description="Cada focinho tem uma história. Encontre um companheiro que combine com você e dê o primeiro passo para um novo começo." />
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
        <LoadingState message="Carregando animais para adoção…" />
      ) : errorMessage ? (
        <ErrorState message={errorMessage} onRetry={() => void refetch()} />
      ) : filteredAnimals.length === 0 ? (
        <EmptyState
          icon={PawPrintIcon}
          title={allAnimals.length === 0 ? 'Nenhum animal disponível no momento' : 'Nenhum animal encontrado'}
          description={allAnimals.length === 0
            ? 'Não há animais marcados para adoção no abrigo no momento. Volte em breve!'
            : 'Tente alterar os termos da busca ou limpar os filtros para ver mais bichinhos.'}
          action={allAnimals.length > 0
            ? <TextButton label="Ver todos os pets" onPress={() => setFilters(defaultSearchAdoptFilters)} />
            : undefined}
        />
      ) : (
        <View className="flex-row flex-wrap items-center justify-center gap-4">
          {filteredAnimals.map((animal) => (
            <PetCard
              key={animal.id}
              name={animal.name}
              imgUrl={animal.photos?.[0]?.photoUrl ?? ''}
              characteristics={formatPetCharacteristics(animal, adopterProfile)}
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
