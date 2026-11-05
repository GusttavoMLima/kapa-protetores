import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FadersIcon, MagnifyingGlassIcon, XIcon } from 'phosphor-react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { palette } from '@/theme';
import { SecondaryInputText } from '@/components/inputText/secondary';
import { PrimaryChipGroup } from '@/components/chips/primaryChip';
import {
  defaultSearchAdoptFilters,
  searchAdoptFormSchema,
  searchAdoptGenderOptions,
  searchAdoptSizeOptions,
  searchAdoptSpeciesOptions,
  type SearchAdoptFilters,
  type SearchAdoptGender,
  type SearchAdoptSize,
  type SearchAdoptSpecies,
} from './model';

export * from './model';
export { useAdoptAnimals, useSearchAdopt } from '@/hooks/useAdoptAnimals';

const ADVANCED_PANEL_DURATION_MS = 220;
const ADVANCED_PANEL_INITIAL_OFFSET_Y = -8;

interface AnimatedAdvancedFiltersPanelProps {
  children: ReactNode;
}

function AnimatedAdvancedFiltersPanel({
  children,
}: AnimatedAdvancedFiltersPanelProps) {
  const panelOpacity = useSharedValue(0);
  const panelTranslateY = useSharedValue(ADVANCED_PANEL_INITIAL_OFFSET_Y);

  useEffect(() => {
    panelOpacity.value = withTiming(1, {
      duration: ADVANCED_PANEL_DURATION_MS,
      easing: Easing.out(Easing.quad),
    });
    panelTranslateY.value = withTiming(0, {
      duration: ADVANCED_PANEL_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [panelOpacity, panelTranslateY]);

  const panelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: panelOpacity.value,
    transform: [{ translateY: panelTranslateY.value }],
  }));

  return (
    <Animated.View style={[styles.advancedFiltersContainer, panelAnimatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  advancedFiltersContainer: {
    width: '100%',
  },
});

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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const defaultValues = useMemo(
    () => ({
      ...defaultSearchAdoptFilters,
      ...initialFilters,
    }),
    [initialFilters],
  );

  const { control, handleSubmit, reset } = useForm<SearchAdoptFilters>({
    resolver: zodResolver(searchAdoptFormSchema),
    defaultValues,
  });

  const watchedFilters = useWatch({
    control,
    defaultValue: defaultValues,
  });
  const prevFiltersRef = useRef(watchedFilters);
  const isFirstRender = useRef(true);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        (watchedFilters.breed ?? '').trim() !== '' ||
          (watchedFilters.specie && watchedFilters.specie !== 'all') ||
          (watchedFilters.gender && watchedFilters.gender !== 'all') ||
          (watchedFilters.size && watchedFilters.size !== 'all'),
      ),
    [watchedFilters],
  );

  const advancedFiltersActiveCount = useMemo(() => {
    let count = 0;
    if (watchedFilters.gender && watchedFilters.gender !== 'all') count += 1;
    if (watchedFilters.size && watchedFilters.size !== 'all') count += 1;
    return count;
  }, [watchedFilters.gender, watchedFilters.size]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const prev = prevFiltersRef.current;
    const chipsChanged =
      prev.specie !== watchedFilters.specie ||
      prev.gender !== watchedFilters.gender ||
      prev.size !== watchedFilters.size;

    prevFiltersRef.current = watchedFilters;

    const validatedFilters: SearchAdoptFilters = {
      breed: watchedFilters.breed ?? '',
      specie: watchedFilters.specie ?? 'all',
      gender: watchedFilters.gender ?? 'all',
      size: watchedFilters.size ?? 'all',
    };

    if (chipsChanged) {
      onSearch(validatedFilters);
      return;
    }

    const timer = setTimeout(() => {
      onSearch(validatedFilters);
    }, 350);

    return () => clearTimeout(timer);
  }, [onSearch, watchedFilters]);

  const handleClearFilters = useCallback(() => {
    reset(defaultSearchAdoptFilters);
    onSearch(defaultSearchAdoptFilters);
  }, [onSearch, reset]);

  const handleDirectSubmit = useCallback(() => {
    void handleSubmit((data: SearchAdoptFilters) => {
      onSearch(data);
    })();
  }, [handleSubmit, onSearch]);

  return (
    <View className={`w-full gap-4 ${className}`}>
      <View className="w-full">
        <Controller
          control={control}
          name="breed"
          render={({ field: { value, onChange } }) => (
            <SecondaryInputText
              placeholder="Buscar por raça"
              value={value}
              onChangeText={onChange}
              icon={<MagnifyingGlassIcon size={20} color={palette.denim} />}
              returnKeyType="search"
              onSubmitEditing={handleDirectSubmit}
              accessibilityLabel="Campo de busca por nome ou raça do animal"
            />
          )}
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
        <Controller
          control={control}
          name="specie"
          render={({ field: { value, onChange } }) => (
            <PrimaryChipGroup<SearchAdoptSpecies>
              options={searchAdoptSpeciesOptions}
              value={value}
              onChange={onChange}
            />
          )}
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
        <AnimatedAdvancedFiltersPanel>
          <View className="p-4 bg-white border border-line rounded-xl gap-4">
            <View className="gap-2">
              <Text className="text-sm font-semibold text-ink-muted">Sexo</Text>
              <Controller
                control={control}
                name="gender"
                render={({ field: { value, onChange } }) => (
                  <PrimaryChipGroup<SearchAdoptGender>
                    options={searchAdoptGenderOptions}
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-ink-muted">Porte</Text>
              <Controller
                control={control}
                name="size"
                render={({ field: { value, onChange } }) => (
                  <PrimaryChipGroup<SearchAdoptSize>
                    options={searchAdoptSizeOptions}
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
            </View>
          </View>
        </AnimatedAdvancedFiltersPanel>
      )}
    </View>
  );
}
