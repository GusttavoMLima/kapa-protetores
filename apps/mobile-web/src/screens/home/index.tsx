import {
  SecondaryCard,
  type SecondaryCardProps,
} from '@/components/cards/secondary';
import { PetCard } from '@/components/cards/pet';
import { useAdoptAnimals } from '@/hooks/useAdoptAnimals';
import { useAuth } from '@/hooks/useAuth';
import { useToggleFavorite } from '@/hooks/useFavorites';
import { useUserProfile } from '@/hooks/useUserProfile';
import { palette } from '@/theme';
import { canManageAnimals, type Animal, type UserRole } from '@kapa/shared';
import { router } from 'expo-router';
import {
  ArrowRightIcon,
  CalendarIcon,
  CatIcon,
  DogIcon,
  HandHeartIcon,
  PawPrintIcon,
  SparkleIcon,
  UsersIcon,
  type IconProps,
} from 'phosphor-react-native';
import { type ComponentType, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

export type HomeSpeciesFilter = 'all' | 'dog' | 'cat';

const FEATURED_PETS_LIMIT = 4;
const CARD_ICON_SIZE = 24;
const FILTER_CHIP_ICON_SIZE = 15;
const EMPTY_STATE_ICON_SIZE = 32;
const CTA_ARROW_ICON_SIZE = 18;
const HERO_SPARKLE_ICON_SIZE = 14;
const CAROUSEL_CARD_GAP = 16;
const SCROLL_BOTTOM_PADDING = 40;
const SOFT_DENIM_BACKGROUND = '#E8EEF5';

const DEFAULT_PET_PHOTO =
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80';

const COMMUNITY_HOME_CARDS: readonly SecondaryCardProps[] = [
  {
    icon: {
      component: (
        <PawPrintIcon
          size={CARD_ICON_SIZE}
          color={palette.orange}
          weight="fill"
        />
      ),
      backgroundColor: palette.peach,
    },
    title: 'Adotar Agora',
    description: 'Encontre seu novo melhor amigo e mude uma vida.',
    link: {
      label: 'Ver pets disponiveis',
      href: '/adopet',
      color: palette.orange,
    },
  },
  {
    icon: {
      component: (
        <HandHeartIcon
          size={CARD_ICON_SIZE}
          color={palette.denim}
          weight="fill"
        />
      ),
      backgroundColor: SOFT_DENIM_BACKGROUND,
    },
    title: 'Ser Voluntario',
    description: 'Descubra como nos apoiar com seu tempo ou doações.',
    link: {
      label: 'Como ajudar',
      href: '/(protected)/volunteer',
      color: palette.denim,
    },
  },
];

const ADOPTION_REQUESTS_CARD: SecondaryCardProps = {
  icon: {
    component: (
      <PawPrintIcon size={CARD_ICON_SIZE} color={palette.denim} weight="fill" />
    ),
    backgroundColor: palette.peach,
  },
  title: 'Solicitações de adoção',
  description: 'Analise as fichas enviadas pelas famílias interessadas.',
  link: {
    label: 'Ver solicitações',
    href: '/gestao/solicitacoes',
    color: palette.denim,
  },
};

const USER_MANAGEMENT_CARD: SecondaryCardProps = {
  icon: {
    component: (
      <UsersIcon size={CARD_ICON_SIZE} color={palette.denim} weight="fill" />
    ),
    backgroundColor: palette.peach,
  },
  title: 'Usuários',
  description: 'Consulte as contas, altere papéis e desative acessos.',
  link: {
    label: 'Gerenciar usuários',
    href: '/(protected)/gestao/usuarios',
    color: palette.denim,
  },
};

const SHELTER_ANIMALS_CARD: SecondaryCardProps = {
  icon: {
    component: (
      <PawPrintIcon size={CARD_ICON_SIZE} color={palette.denim} weight="fill" />
    ),
    backgroundColor: palette.peach,
  },
  title: 'Animais do abrigo',
  description: 'Acompanhe os resgates e atualize os cuidados de cada animal.',
  link: {
    label: 'Gerenciar animais',
    href: '/gestao/animais',
    color: palette.denim,
  },
};

const ACTIVITY_MANAGEMENT_CARDS: readonly SecondaryCardProps[] = [
  {
    icon: {
      component: (
        <CalendarIcon
          size={CARD_ICON_SIZE}
          color={palette.denim}
          weight="fill"
        />
      ),
      backgroundColor: palette.peach,
    },
    title: 'Organizar atividades',
    description: 'Cadastre as ações da semana para os voluntários.',
    link: {
      label: 'Gerenciar semana',
      href: '/(protected)/manage-activities',
      color: palette.denim,
    },
  },
  {
    icon: {
      component: (
        <HandHeartIcon
          size={CARD_ICON_SIZE}
          color={palette.denim}
          weight="fill"
        />
      ),
      backgroundColor: palette.peach,
    },
    title: 'Candidaturas de voluntários',
    description: 'Analise e aprove novos voluntários para o abrigo.',
    link: {
      label: 'Ver candidaturas',
      href: '/(protected)/gestao/voluntarios',
      color: palette.denim,
    },
  },
];

interface SpeciesFilterOption {
  value: HomeSpeciesFilter;
  label: string;
  accessibilityLabel: string;
  Icon: ComponentType<IconProps>;
}

const SPECIES_FILTER_OPTIONS: readonly SpeciesFilterOption[] = [
  {
    value: 'all',
    label: 'Todos',
    accessibilityLabel: 'Filtrar todos os pets',
    Icon: PawPrintIcon,
  },
  {
    value: 'dog',
    label: 'Cães',
    accessibilityLabel: 'Filtrar cães',
    Icon: DogIcon,
  },
  {
    value: 'cat',
    label: 'Gatos',
    accessibilityLabel: 'Filtrar gatos',
    Icon: CatIcon,
  },
];

function formatAgeLabel(age: number | null | undefined): string | null {
  if (age === 0) return 'Filhote';
  if (age === 1) return '1 ano';
  if (typeof age === 'number') return `${age} anos`;
  return null;
}

export function formatPetCharacteristics(animal: Animal): string[] {
  const genderLabel = animal.gender === 'female' ? 'Fêmea' : 'Macho';
  const ageLabel = formatAgeLabel(animal.age);

  return ageLabel ? [ageLabel, genderLabel] : [genderLabel];
}

function canManageWeeklyActivities(role?: UserRole): boolean {
  return role === 'admin' || role === 'protector';
}

export function buildStaffHomeCards(role?: UserRole): SecondaryCardProps[] {
  const cards: SecondaryCardProps[] = [];

  if (canManageAnimals(role)) {
    if (role === 'admin') {
      cards.push(ADOPTION_REQUESTS_CARD);
    }
    cards.push(SHELTER_ANIMALS_CARD);
  }

  if (canManageWeeklyActivities(role)) {
    cards.push(...ACTIVITY_MANAGEMENT_CARDS);
  }

  if (role === 'admin') {
    cards.push(USER_MANAGEMENT_CARD);
  }

  return cards;
}

export function calculateSpeciesCounts(
  animals: readonly Animal[],
): Record<HomeSpeciesFilter, number> {
  let dogCount = 0;
  let catCount = 0;

  for (const animal of animals) {
    if (animal.species === 'dog') dogCount += 1;
    else if (animal.species === 'cat') catCount += 1;
  }

  return {
    all: animals.length,
    dog: dogCount,
    cat: catCount,
  };
}

export function filterAnimalsBySpecies(
  animals: readonly Animal[],
  species: HomeSpeciesFilter,
): Animal[] {
  if (species === 'all') return [...animals];
  return animals.filter((animal) => animal.species === species);
}

function formatWaitingPetsBadge(count: number): string {
  return count === 1
    ? '1 pet esperando um lar'
    : `${count} pets esperando um lar`;
}

function formatViewAllPetsLabel(count: number): string {
  return `Ver todos os ${count} ${count === 1 ? 'pet' : 'pets'}`;
}

interface HomeHeroBannerProps {
  username?: string | null;
  availableCount: number;
  isLoading: boolean;
}

function HomeHeroBanner({
  username,
  availableCount,
  isLoading,
}: HomeHeroBannerProps) {
  const headline = username
    ? `Olá, ${username}! Que bom ter você aqui.`
    : 'Todo resgate merece um final feliz.';

  return (
    <View className="bg-white border border-line rounded-2xl p-6 md:p-8 shadow-card gap-4">
      <View className="flex-row flex-wrap items-center gap-2">
        <View className="bg-peach px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
          <SparkleIcon
            size={HERO_SPARKLE_ICON_SIZE}
            color={palette.orange}
            weight="fill"
          />
          <Text className="font-body-medium font-bold text-xs text-denim">
            KAPA Protetores • Mogi-Guaçu
          </Text>
        </View>
        {!isLoading && availableCount > 0 && (
          <View className="bg-cream-dark px-3 py-1.5 rounded-full">
            <Text className="font-body-medium text-xs text-ink-muted">
              {formatWaitingPetsBadge(availableCount)}
            </Text>
          </View>
        )}
      </View>

      <View className="gap-2 max-w-[680px]">
        <Text className="font-heading-bold font-extrabold text-2xl md:text-3xl text-ink tracking-tight">
          {headline}
        </Text>
        <Text className="font-body text-base text-ink-muted leading-6">
          Acolhemos, cuidamos e conectamos animais resgatados a lares cheios de
          afeto. Conheça os pets disponíveis ou apoie nossa missão como
          voluntário.
        </Text>
      </View>
    </View>
  );
}

interface HomeCardCarouselSectionProps {
  title: string;
  badgeLabel?: string;
  cards: readonly SecondaryCardProps[];
}

function HomeCardCarouselSection({
  title,
  badgeLabel,
  cards,
}: HomeCardCarouselSectionProps) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <Text className="font-heading-bold font-bold text-lg text-ink tracking-tight">
          {title}
        </Text>
        {badgeLabel && (
          <View className="bg-peach px-2.5 py-0.5 rounded-full">
            <Text className="font-body-medium font-bold text-xs text-denim">
              {badgeLabel}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: CAROUSEL_CARD_GAP }}
        className="flex-row"
      >
        {cards.map((card) => (
          <SecondaryCard key={card.title} {...card} />
        ))}
      </ScrollView>
    </View>
  );
}

interface SpeciesFilterBarProps {
  selectedSpecies: HomeSpeciesFilter;
  counts: Record<HomeSpeciesFilter, number>;
  onSelectSpecies: (species: HomeSpeciesFilter) => void;
}

function SpeciesFilterBar({
  selectedSpecies,
  counts,
  onSelectSpecies,
}: SpeciesFilterBarProps) {
  return (
    <View className="flex-row items-center gap-2">
      {SPECIES_FILTER_OPTIONS.map(
        ({ value, label, accessibilityLabel, Icon }) => {
          const isSelected = selectedSpecies === value;
          const iconColor = isSelected ? '#FFFFFF' : palette.inkMuted;

          return (
            <Pressable
              key={value}
              onPress={() => onSelectSpecies(value)}
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel}
              className={`px-3.5 py-2 rounded-full border flex-row items-center gap-1.5 ${
                isSelected ? 'bg-orange border-orange' : 'bg-white border-line'
              }`}
            >
              <Icon
                size={FILTER_CHIP_ICON_SIZE}
                weight="fill"
                color={iconColor}
              />
              <Text
                className={`font-body-medium font-bold text-xs ${
                  isSelected ? 'text-white' : 'text-ink-muted'
                }`}
              >
                {label} ({counts[value]})
              </Text>
            </Pressable>
          );
        },
      )}
    </View>
  );
}

interface FeaturedPetsStateCardProps {
  message: string;
  iconColor: string;
}

function FeaturedPetsStateCard({
  message,
  iconColor,
}: FeaturedPetsStateCardProps) {
  return (
    <View className="bg-white border border-line rounded-2xl p-8 items-center justify-center gap-2">
      <PawPrintIcon
        size={EMPTY_STATE_ICON_SIZE}
        color={iconColor}
        weight="duotone"
      />
      <Text className="font-body text-base text-ink-muted text-center">
        {message}
      </Text>
    </View>
  );
}

export function HomeScreen() {
  const { user } = useAuth();
  const { data: animals = [], isLoading: isLoadingAnimals } = useAdoptAnimals();
  const { data: profile } = useUserProfile();
  const { mutate: toggleFavorite } = useToggleFavorite();
  const [speciesFilter, setSpeciesFilter] = useState<HomeSpeciesFilter>('all');

  const favoritedIds = useMemo(
    () =>
      new Set(profile?.favorites.map((favorite) => favorite.animalId) ?? []),
    [profile?.favorites],
  );

  const availableAnimals = useMemo(
    () => animals.filter((animal) => animal.status === 'available'),
    [animals],
  );

  const speciesCounts = useMemo(
    () => calculateSpeciesCounts(availableAnimals),
    [availableAnimals],
  );

  const featuredAnimals = useMemo(
    () =>
      filterAnimalsBySpecies(availableAnimals, speciesFilter).slice(
        0,
        FEATURED_PETS_LIMIT,
      ),
    [availableAnimals, speciesFilter],
  );

  const staffCards = useMemo(
    () => buildStaffHomeCards(user?.role),
    [user?.role],
  );

  const handleOpenPetDetails = (animalId: string) => {
    router.push({
      pathname: '/adopet/[id]',
      params: { id: animalId },
    });
  };

  const username = user?.username ? user.username.split(' ')[0] : 'Unkown';

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: palette.cream }}
      contentContainerStyle={{ paddingBottom: SCROLL_BOTTOM_PADDING }}
    >
      <View className="w-full max-w-content self-center px-5 md:px-10 py-6 gap-8">
        <HomeHeroBanner
          username={username}
          availableCount={availableAnimals.length}
          isLoading={isLoadingAnimals}
        />

        <HomeCardCarouselSection
          title="Como participar"
          cards={COMMUNITY_HOME_CARDS}
        />

        {staffCards.length > 0 && (
          <HomeCardCarouselSection
            title="Gestão do abrigo"
            badgeLabel="Equipe KAPA"
            cards={staffCards}
          />
        )}

        <View className="gap-5">
          <View className="flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <View className="gap-1">
              <Text className="font-heading-bold font-extrabold tracking-tight text-2xl text-ink">
                Esperando por você
              </Text>
              <Text className="font-body text-sm text-ink-muted">
                Conheça alguns dos companheiros prontos para adoção responsável
              </Text>
            </View>

            <SpeciesFilterBar
              selectedSpecies={speciesFilter}
              counts={speciesCounts}
              onSelectSpecies={setSpeciesFilter}
            />
          </View>

          {isLoadingAnimals ? (
            <FeaturedPetsStateCard
              message="Carregando pets disponíveis..."
              iconColor={palette.orange}
            />
          ) : featuredAnimals.length === 0 ? (
            <FeaturedPetsStateCard
              message="Ainda não há pets disponíveis para adoção."
              iconColor={palette.inkMuted}
            />
          ) : (
            <View className="gap-6">
              <View className="flex-row flex-wrap justify-center sm:justify-start gap-5">
                {featuredAnimals.map((animal) => (
                  <PetCard
                    key={animal.id}
                    name={animal.name}
                    imgUrl={animal.photos?.[0]?.photoUrl ?? DEFAULT_PET_PHOTO}
                    characteristics={formatPetCharacteristics(animal)}
                    isFavorited={favoritedIds.has(animal.id)}
                    onPress={() => handleOpenPetDetails(animal.id)}
                    onToggleFavorite={() => toggleFavorite(animal.id)}
                  />
                ))}
              </View>

              <Pressable
                onPress={() => router.push('/adopet')}
                accessibilityRole="button"
                accessibilityLabel="Ver todos os pets para adoção"
                className="self-center border border-denim bg-white rounded-xl px-6 py-3 flex-row items-center gap-2 active:scale-[0.99]"
              >
                <Text className="text-denim font-body-medium font-bold text-base">
                  {formatViewAllPetsLabel(availableAnimals.length)}
                </Text>
                <ArrowRightIcon
                  size={CTA_ARROW_ICON_SIZE}
                  weight="bold"
                  color={palette.denim}
                />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
