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
import { canManageAnimals, RecommendedAnimals } from '@kapa/shared';
import { PetCard } from '@/components/cards/pet';

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

const mockFavorited: RecommendedAnimals[] = [
  {
    id: 'eqewq',
    name: 'Gilda',
    photo:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVc2eHkzKA26dGfeGx7aTgRLX7bYAGfmcEbwvEyWNp5w&s=10',
    characteristics: ['Filhote', 'Fêmea'],
  },
  {
    id: 'eqewqewq',
    name: 'Gilda',
    photo:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVc2eHkzKA26dGfeGx7aTgRLX7bYAGfmcEbwvEyWNp5w&s=10',
    characteristics: ['Filhote', 'Fêmea'],
    isFavorited: true,
  },
  {
    id: 'eqewqewq1',
    name: 'Gilda',
    photo:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVc2eHkzKA26dGfeGx7aTgRLX7bYAGfmcEbwvEyWNp5w&s=10',
    characteristics: ['Filhote', 'Fêmea'],
    isFavorited: true,
  },
  {
    id: 'eqewqewq2',
    name: 'Gilda',
    photo:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVc2eHkzKA26dGfeGx7aTgRLX7bYAGfmcEbwvEyWNp5w&s=10',
    characteristics: ['Filhote', 'Fêmea'],
    isFavorited: true,
  },
];

export function HomeScreen() {
  const { user } = useAuth();
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
        <View className="flex-row flex-wrap justify-center sm:justify-start gap-4 my-8">
          {mockFavorited.map((pet) => (
            <PetCard
              key={pet.id}
              name={pet.name}
              imgUrl={pet.photo}
              characteristics={pet.characteristics}
              isFavorited={pet.isFavorited}
            />
          ))}
        </View>
        <Pressable
          onPress={() => router.push('/adopet')}
          accessibilityRole="button"
          accessibilityLabel="Ver todos os pets para adoção"
        >
          <Text className="mx-auto text-denim font-body font-bold text-lg active:underline">
            Ver todos os 45 Pets
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
