import { ImageBackground, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRightIcon, UserPlusIcon } from 'phosphor-react-native';
import type { SecondaryCardProps } from '@/components/cards/secondary';
import { useAuth } from '@/hooks/useAuth';
import { palette } from '@/theme';


export function ShelterDashboard({ cards }: { cards: readonly SecondaryCardProps[] }) {
  const { user } = useAuth();
  return (
    <ScrollView className="flex-1 bg-cream" contentContainerClassName="pb-10">
      <View className="w-full max-w-content self-center px-5 md:px-10 py-6 gap-8">
        <ImageBackground source={require('../../../assets/figma/kapa-team.png')} resizeMode="cover" className="overflow-hidden rounded-2xl bg-denim">
          <View className="bg-denim/70 p-6 md:p-10 gap-5 min-h-64 justify-end">
            <View className="self-start rounded-full bg-peach px-3 py-2">
              <Text className="font-body-medium text-xs tracking-widest text-denim">EQUIPE KAPA • GESTÃO DO ABRIGO</Text>
            </View>
            <Text accessibilityRole="header" className="font-heading-bold text-3xl md:text-4xl text-white max-w-form">Juntos, fazemos o cuidado acontecer.</Text>
            <Text className="font-body text-base leading-6 text-white max-w-form">Olá, {user?.username?.split(' ')[0] || 'equipe'}! Aqui você acompanha os resgates, as famílias e quem ajuda a transformar cada história.</Text>
          </View>
        </ImageBackground>
        <View className="gap-2">
          <Text accessibilityRole="header" className="font-heading-bold text-2xl text-ink">Gestão do abrigo</Text>
          <Text className="font-body text-base text-ink-muted">O próximo passo de cada cuidado começa aqui.</Text>
        </View>
        {Platform.OS === 'web' ? (
          <View testID="home-card-grid" className="flex-row flex-wrap gap-4">
            {cards.map((card) => <ManagementCard key={card.title} card={card} />)}
          </View>
        ) : (
          <ScrollView testID="home-card-carousel" horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-4">
            {cards.map((card) => <ManagementCard key={card.title} card={card} />)}
          </ScrollView>
        )}
        {user?.role === 'admin' && (
          <Pressable accessibilityRole="button" accessibilityLabel="Cadastrar usuário da equipe" onPress={() => router.push('/cadastro-usuario')}
            className="min-h-12 flex-row items-center gap-4 rounded-2xl bg-white border border-line p-5">
            <UserPlusIcon size={24} color={palette.denim} />
            <View className="flex-1 gap-1"><Text className="font-heading-bold text-base text-denim">Mais mãos para cuidar</Text><Text className="font-body text-sm text-ink-muted">Cadastrar um usuário e definir seu papel na equipe.</Text></View>
            <ArrowRightIcon size={20} color={palette.denim} />
          </Pressable>
        )}
        <Text className="font-body text-sm text-center text-ink-muted">Desde 2002, transformando cuidado em novos começos.</Text>
      </View>
    </ScrollView>
  );
}

function ManagementCard({ card }: { card: SecondaryCardProps }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${card.title} - ${card.link.label}`} onPress={() => router.push(card.link.href)}
      className={`rounded-2xl border border-line bg-white p-6 gap-5 shadow-card hover:bg-peach active:opacity-80 ${Platform.OS === 'web' ? 'w-full md:w-[48%] grow' : 'w-72'}`}>
      <View className="size-14 rounded-2xl bg-peach items-center justify-center">{card.icon.component}</View>
      <View className="gap-2"><Text className="font-heading-bold text-xl text-ink">{card.title}</Text><Text className="font-body text-base leading-6 text-ink-muted">{card.description}</Text></View>
      <View className="flex-row items-center justify-between border-t border-line pt-4"><Text className="font-body-medium text-sm text-denim">{card.link.label}</Text><ArrowRightIcon size={20} color={palette.denim} /></View>
    </Pressable>
  );
}
