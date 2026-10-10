import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { PawPrintIcon } from 'phosphor-react-native';
import { isAxiosError } from 'axios';
import type { Animal, ApiResponse } from '@kapa/shared';
import { palette } from '@/theme';
import {
  SearchAdoptForm,
  matchesSearchAdoptFilters,
  defaultSearchAdoptFilters,
  type SearchAdoptFilters,
} from '@/components/forms/searchAdopt';
import { PetCard } from '@/components/cards/pet';
import { PrimaryButton } from '@/components/buttons/primary';
import { kapaService } from '@/services/kapaService';

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
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchAdoptFilters>(
    defaultSearchAdoptFilters,
  );
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

  const fetchAnimals = useCallback(async () => {
    const response = await kapaService.get<
      ApiResponse<Animal[]> & { count?: number }
    >('/animals');

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  }, []);

  useEffect(() => {
    let isActive = true;

    void fetchAnimals()
      .then((data) => {
        if (isActive) {
          setAnimals(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (isActive) {
          const message =
            isAxiosError<{ message?: string; error?: string }>(err) &&
            (err.response?.data?.message || err.response?.data?.error)
              ? (err.response.data.message ?? err.response.data.error)
              : 'Não foi possível carregar os animais para adoção. Verifique sua conexão e tente novamente.';
          setError(message ?? 'Erro desconhecido ao carregar os animais.');
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [fetchAnimals]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchAnimals();
      setAnimals(data);
      setError(null);
    } catch (err: unknown) {
      const message =
        isAxiosError<{ message?: string; error?: string }>(err) &&
        (err.response?.data?.message || err.response?.data?.error)
          ? (err.response.data.message ?? err.response.data.error)
          : 'Não foi possível carregar os animais para adoção. Verifique sua conexão e tente novamente.';
      setError(message ?? 'Erro desconhecido ao carregar os animais.');
    } finally {
      setRefreshing(false);
    }
  }, [fetchAnimals]);

  const handleRetry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAnimals();
      setAnimals(data);
    } catch (err: unknown) {
      const message =
        isAxiosError<{ message?: string; error?: string }>(err) &&
        (err.response?.data?.message || err.response?.data?.error)
          ? (err.response.data.message ?? err.response.data.error)
          : 'Não foi possível carregar os animais para adoção. Verifique sua conexão e tente novamente.';
      setError(message ?? 'Erro desconhecido ao carregar os animais.');
    } finally {
      setLoading(false);
    }
  }, [fetchAnimals]);

  const handleToggleFavorite = useCallback((id: string) => {
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSearch = useCallback((newFilters: SearchAdoptFilters) => {
    setFilters(newFilters);
  }, []);

  const filteredAnimals = useMemo(() => {
    return animals.filter((animal) =>
      matchesSearchAdoptFilters(animal, filters),
    );
  }, [animals, filters]);

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: palette.cream }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void handleRefresh()}
          tintColor={palette.orange}
          colors={[palette.orange]}
        />
      }
    >
      <SearchAdoptForm onSearch={handleSearch} initialFilters={filters} />

      <View className="flex-row items-center justify-between border-t border-line pt-4">
        <Text className="font-heading-bold text-lg text-ink">
          {loading
            ? 'Buscando amigos...'
            : `${filteredAnimals.length} ${
                filteredAnimals.length === 1
                  ? 'pet disponível'
                  : 'pets disponíveis'
              }`}
        </Text>
      </View>

      {loading ? (
        <View className="py-16 items-center justify-center gap-3">
          <ActivityIndicator size="large" color={palette.orange} />
          <Text className="font-body text-sm text-ink-muted">
            Carregando animais para adoção...
          </Text>
        </View>
      ) : error ? (
        <View className="p-6 bg-white border border-danger-soft rounded-2xl items-center gap-3">
          <Text className="font-heading-bold text-base text-danger text-center">
            Erro ao carregar lista de pets
          </Text>
          <Text className="font-body text-sm text-ink-muted text-center max-w-sm">
            {error}
          </Text>
          <View className="w-48 mt-2">
            <PrimaryButton
              title="Tentar novamente"
              onPress={() => void handleRetry()}
              size="sm"
            />
          </View>
        </View>
      ) : filteredAnimals.length === 0 ? (
        <View className="py-16 px-4 bg-white border border-line rounded-2xl items-center justify-center gap-3">
          <PawPrintIcon size={44} color={palette.denim} weight="duotone" />
          <Text className="font-heading-bold text-base text-ink text-center">
            {animals.length === 0
              ? 'Nenhum animal disponível no momento'
              : 'Nenhum animal encontrado'}
          </Text>
          <Text className="font-body text-sm text-ink-muted text-center max-w-xs">
            {animals.length === 0
              ? 'Não há animais marcados para adoção no abrigo no momento. Volte em breve!'
              : 'Tente alterar os termos da busca ou limpar os filtros para ver mais bichinhos.'}
          </Text>
          {animals.length > 0 && (
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
        <View className="flex-row flex-wrap justify-center sm:justify-start gap-4">
          {filteredAnimals.map((animal) => (
            <PetCard
              key={animal.id}
              name={animal.name}
              imgUrl={animal.photos?.[0]?.photoUrl ?? DEFAULT_PET_PHOTO}
              characteristics={formatPetCharacteristics(animal)}
              isFavorited={favoritedIds.has(animal.id)}
              onToggleFavorite={() => handleToggleFavorite(animal.id)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
