import {
  SecondaryCard,
  SecondaryCardProps,
} from '@/components/cards/secondary';
import { useAuth } from '@/hooks/useAuth';
import { palette } from '@/theme';
import {
  CalendarIcon,
  HandHeartIcon,
  PawPrintIcon,
} from 'phosphor-react-native';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { canManageAnimals, type Animal } from '@kapa/shared';
import { PetCard } from '@/components/cards/pet';
import { useAdoptAnimals } from '@/hooks/useAdoptAnimals';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToggleFavorite } from '@/hooks/useFavorites';

const secondaryHomeCards: SecondaryCardProps[] = [
  {
    icon: {
      component: <PawPrintIcon size={24} color="#C10007" weight="fill" />,
      backgroundColor: '#FFA2A2',
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
      component: <HandHeartIcon size={24} color="#615FFF" weight="fill" />,
      backgroundColor: '#A3B3FF',
    },
    title: 'Ser Voluntario',
    description: 'Descubra como nos apoiar com seu tempo ou doações.',
    link: {
      label: 'Como ajudar',
      href: '/adopet',
      color: '#615FFF',
    },
  },
];

const DEFAULT_PET_PHOTO =
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80';

function formatPetCharacteristics(animal: Animal): string[] {
  const characteristics = [animal.gender === 'female' ? 'Fêmea' : 'Macho'];

  if (animal.age === 0) characteristics.unshift('Filhote');
  else if (animal.age === 1) characteristics.unshift('1 ano');
  else if (typeof animal.age === 'number') characteristics.unshift(`${animal.age} anos`);

  return characteristics;
}

export function HomeScreen() {
  const { user } = useAuth();
  const { data: animals = [], isLoading: isLoadingAnimals } = useAdoptAnimals();
  const { data: profile } = useUserProfile();
  const { mutate: toggleFavorite } = useToggleFavorite();
  const favoritedIds = useMemo(
    () => new Set(profile?.favorites.map((favorite) => favorite.animalId) ?? []),
    [profile?.favorites],
  );
  const availableAnimals = useMemo(
    () => animals.filter((animal) => animal.status === 'available'),
    [animals],
  );
  const featuredAnimals = availableAnimals.slice(0, 4);
  const canManageActivities =
    user?.role === 'admin' || user?.role === 'protector';
  const cards: SecondaryCardProps[] = canManageActivities
    ? [
        ...secondaryHomeCards,
        {
          icon: {
            component: (
              <CalendarIcon size={24} color={palette.denim} weight="fill" />
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
      ]
    : secondaryHomeCards;

  const visibleCards = canManageAnimals(user?.role)
    ? [
        ...(user?.role === 'admin'
          ? [{
              icon: {
                component: <PawPrintIcon size={24} color={palette.denim} weight="fill" />,
                backgroundColor: palette.peach,
              },
              title: 'Solicitações de adoção',
              description: 'Analise as fichas enviadas pelas famílias interessadas.',
              link: { label: 'Ver solicitações', href: '/gestao/solicitacoes' as const, color: palette.denim },
            }]
          : []),
        {
          icon: {
            component: (
              <PawPrintIcon size={24} color={palette.denim} weight="fill" />
            ),
            backgroundColor: palette.peach,
          },
          title: 'Animais do abrigo',
          description:
            'Acompanhe os resgates e atualize os cuidados de cada animal.',
          link: {
            label: 'Gerenciar animais',
            href: '/gestao/animais' as const,
            color: palette.denim,
          },
        },
        ...cards,
      ]
    : cards;

  return (
    <ScrollView
      className="flex-1 p-4 gap-4"
      style={{ backgroundColor: palette.cream }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 16 }}
        className="flex-row"
      >
        {visibleCards.map((card, index) => (
          <SecondaryCard key={index} {...card} />
        ))}
      </ScrollView>

      <View className="my-8">
        <Text className="font-heading font-[800] tracking-wide text-xl">
          Esperando por você
        </Text>
        {isLoadingAnimals ? (
          <Text className="font-body text-base text-ink-muted mt-4">
            Carregando pets disponíveis...
          </Text>
        ) : featuredAnimals.length === 0 ? (
          <Text className="font-body text-base text-ink-muted mt-4">
            Ainda não há pets disponíveis para adoção.
          </Text>
        ) : (
          <>
            <View className="flex-row flex-wrap justify-center sm:justify-start gap-4 my-8">
              {featuredAnimals.map((animal) => (
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
                  onToggleFavorite={() => toggleFavorite(animal.id)}
                />
              ))}
            </View>
            <Pressable
              onPress={() => router.push('/adopet')}
              accessibilityRole="button"
              accessibilityLabel="Ver todos os pets para adoção"
            >
              <Text className="mx-auto text-denim font-body font-bold text-lg active:underline">
                Ver todos os {availableAnimals.length} {availableAnimals.length === 1 ? 'pet' : 'pets'}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}
