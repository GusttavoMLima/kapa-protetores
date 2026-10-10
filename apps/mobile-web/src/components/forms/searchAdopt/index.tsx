import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FadersIcon, MagnifyingGlassIcon, XIcon } from 'phosphor-react-native';
import { palette } from '@/theme';
import { SecondaryInputText } from '@/components/inputText/secondary';
import { PrimaryChipGroup } from '@/components/chips/primaryChip';
import {
  defaultSearchAdoptFilters,
  searchAdoptGenderOptions,
  searchAdoptSizeOptions,
  searchAdoptSpeciesOptions,
  type SearchAdoptFilters,
  type SearchAdoptGender,
  type SearchAdoptSize,
  type SearchAdoptSpecies,
} from './model';

export * from './model';

export interface SearchAdoptFormProps {
  onSearch: (filters: SearchAdoptFilters) => void;
  initialFilters?: Partial<SearchAdoptFilters>;
  className?: string;
}

export function SearchAdoptForm({
  onSearch,
  initialFilters,
  className = '',
}: SearchAdoptFormProps) {
  const [filters, setFilters] = useState<SearchAdoptFilters>(() => ({
    ...defaultSearchAdoptFilters,
    ...initialFilters,
  }));
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  const prevFiltersRef = useRef(filters);
  const isFirstRender = useRef(true);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.breed.trim() !== '' ||
          filters.specie !== 'all' ||
          filters.gender !== 'all' ||
          filters.size !== 'all',
      ),
    [filters],
  );

  const advancedFiltersActiveCount = useMemo(() => {
    let count = 0;
    if (filters.gender !== 'all') count += 1;
    if (filters.size !== 'all') count += 1;
    return count;
  }, [filters.gender, filters.size]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const prev = prevFiltersRef.current;
    const chipsChanged =
      prev.specie !== filters.specie ||
      prev.gender !== filters.gender ||
      prev.size !== filters.size;

    prevFiltersRef.current = filters;

    if (chipsChanged) {
      onSearchRef.current(filters);
      return;
    }

    const timer = setTimeout(() => {
      onSearchRef.current(filters);
    }, 350);

    return () => clearTimeout(timer);
  }, [filters]);

  const handleFieldChange = useCallback(
    <K extends keyof SearchAdoptFilters>(
      key: K,
      value: SearchAdoptFilters[K],
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleClearFilters = useCallback(() => {
    const cleared: SearchAdoptFilters = {
      breed: '',
      specie: 'all',
      gender: 'all',
      size: 'all',
    };
    setFilters(cleared);
    onSearchRef.current(cleared);
  }, []);

  const handleDirectSubmit = useCallback(() => {
    onSearchRef.current(filters);
  }, [filters]);

  return (
    <View className={`w-full gap-4 ${className}`}>
      <View className="w-full">
        <SecondaryInputText
          placeholder="Buscar por raça"
          value={filters.breed}
          onChangeText={(text) => handleFieldChange('breed', text)}
          icon={<MagnifyingGlassIcon size={20} color={palette.denim} />}
          returnKeyType="search"
          onSubmitEditing={handleDirectSubmit}
          accessibilityLabel="Campo de busca por nome ou raça do animal"
        />
      </View>

      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-ink-muted">Espécie</Text>
          {hasActiveFilters && (
            <Pressable
              onPress={handleClearFilters}
              accessibilityRole="button"
              accessibilityLabel="Limpar todos os filtros"
              className="flex-row items-center gap-1 py-1 px-2 rounded active:opacity-70"
            >
              <XIcon size={14} color={palette.orange} weight="bold" />
              <Text className="text-xs font-semibold text-orange">
                Limpar filtros
              </Text>
            </Pressable>
          )}
        </View>
        <PrimaryChipGroup<SearchAdoptSpecies>
          options={searchAdoptSpeciesOptions}
          value={filters.specie}
          onChange={(value) => handleFieldChange('specie', value)}
        />
      </View>

      <View className="w-full">
        <Pressable
          onPress={() => setShowAdvancedFilters((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={
            showAdvancedFilters
              ? 'Ocultar filtros de sexo e porte'
              : 'Mostrar mais filtros de sexo e porte'
          }
          className="flex-row items-center justify-between py-2.5 px-3.5 bg-white border border-border rounded-xl active:bg-peach"
        >
          <View className="flex-row items-center gap-2">
            <FadersIcon size={18} color={palette.denim} />
            <Text className="text-sm font-semibold text-denim">
              {showAdvancedFilters
                ? 'Menos filtros'
                : 'Mais filtros (Sexo e Porte)'}
            </Text>
          </View>
          {advancedFiltersActiveCount > 0 && !showAdvancedFilters && (
            <View className="bg-orange px-2 py-0.5 rounded-full items-center justify-center">
              <Text className="text-xs font-bold text-white">
                {advancedFiltersActiveCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {showAdvancedFilters && (
        <View className="p-4 bg-white border border-line rounded-xl gap-4">
          <View className="gap-2">
            <Text className="text-sm font-semibold text-ink-muted">Sexo</Text>
            <PrimaryChipGroup<SearchAdoptGender>
              options={searchAdoptGenderOptions}
              value={filters.gender}
              onChange={(value) => handleFieldChange('gender', value)}
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-ink-muted">Porte</Text>
            <PrimaryChipGroup<SearchAdoptSize>
              options={searchAdoptSizeOptions}
              value={filters.size}
              onChange={(value) => handleFieldChange('size', value)}
            />
          </View>
        </View>
      )}
    </View>
  );
}
