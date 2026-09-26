import {
  SecondaryCard,
  SecondaryCardProps,
} from '@/components/cards/secondary';
import { useAuth } from '@/hooks/useAuth';
import { palette } from '@/theme';
import { CalendarIcon, HandHeartIcon, PawPrintIcon } from 'phosphor-react-native';
import { ScrollView } from 'react-native';

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

export function HomeScreen() {
  const { user } = useAuth();
  const canManageActivities = user?.role === 'admin' || user?.role === 'protector';
  const cards: SecondaryCardProps[] = canManageActivities
    ? [
        ...secondaryHomeCards,
        {
          icon: {
            component: <CalendarIcon size={24} color={palette.denim} weight="fill" />,
            backgroundColor: palette.peach,
          },
          title: 'Organizar atividades',
          description: 'Cadastre as ações da semana para os voluntários.',
          link: {
            label: 'Gerenciar semana',
            href: '/(protected)/activities',
            color: palette.denim,
          },
        },
      ]
    : secondaryHomeCards;

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
        {cards.map((card, index) => (
          <SecondaryCard key={index} {...card} />
        ))}
      </ScrollView>
    </ScrollView>
  );
}
