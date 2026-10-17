import { router } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeftIcon, CheckCircleIcon, ClockIcon, PawPrintIcon, XCircleIcon } from 'phosphor-react-native';
import { useMyAdoptions } from '@/hooks/useAdoptions';
import { palette } from '@/theme';

const statusInfo = {
  pending: { label: 'Em análise', description: 'O abrigo ainda está avaliando a sua ficha.', color: palette.orangeDark, background: palette.peach, Icon: ClockIcon },
  interviewing: { label: 'Em conversa', description: 'O abrigo entrará em contato para continuar o processo.', color: palette.denim, background: '#E4EEFA', Icon: ClockIcon },
  approved: { label: 'Aprovada', description: 'Parabéns! O abrigo aprovou a sua solicitação.', color: palette.success, background: palette.successSoft, Icon: CheckCircleIcon },
  rejected: { label: 'Não aprovada', description: 'Esta solicitação não foi aprovada pelo abrigo.', color: palette.danger, background: palette.dangerSoft, Icon: XCircleIcon },
  canceled: { label: 'Cancelada', description: 'Esta solicitação foi cancelada.', color: palette.inkMuted, background: '#EDEAE6', Icon: XCircleIcon },
};

export function MyAdoptionsScreen() {
  const { data: adoptions = [], isLoading, error, refetch } = useMyAdoptions();

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 20 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar para o perfil"
        className="min-h-10 self-start flex-row items-center gap-2 py-2 pr-4"
        onPress={() => router.replace('/(protected)/(tabs)/profile')}
      >
        <ArrowLeftIcon size={18} color={palette.denim} />
        <Text className="font-body-medium text-sm text-denim">Voltar ao perfil</Text>
      </Pressable>
      <View className="items-center bg-white rounded-2xl border border-line px-5 py-6 gap-2">
        <View className="w-12 h-12 rounded-full bg-peach items-center justify-center"><PawPrintIcon size={26} color={palette.orange} weight="fill" /></View>
        <Text className="font-heading-bold text-3xl text-ink text-center">Minhas solicitações</Text>
        <Text className="font-body text-base text-ink-muted text-center">Acompanhe aqui cada processo de adoção.</Text>
      </View>

      {isLoading ? <View className="py-16 items-center gap-3"><ActivityIndicator size="large" color={palette.orange} /><Text className="font-body text-ink-muted">Carregando solicitações...</Text></View>
        : error ? <View className="bg-white rounded-2xl border border-danger-soft p-6 items-center gap-3"><Text className="font-heading-bold text-danger text-center">Não foi possível carregar suas solicitações.</Text><Pressable onPress={() => void refetch()} className="bg-orange px-5 py-3 rounded-lg"><Text className="font-body-bold text-white">Tentar novamente</Text></Pressable></View>
          : adoptions.length === 0 ? <View className="bg-white rounded-2xl border border-line p-10 items-center gap-3"><PawPrintIcon size={44} color={palette.denim} /><Text className="font-heading-bold text-lg text-ink text-center">Nenhuma solicitação ainda</Text><Text className="font-body text-sm text-ink-muted text-center">Quando você enviar uma ficha de adoção, ela aparecerá aqui.</Text><Pressable onPress={() => router.push('/(protected)/(tabs)/adopet')} className="mt-2 bg-orange px-5 py-3 rounded-lg"><Text className="font-body-bold text-white">Ver pets disponíveis</Text></Pressable></View>
            : adoptions.map((adoption) => {
              const info = statusInfo[adoption.status];
              const Icon = info.Icon;
              const photo = adoption.animal?.photos?.[0]?.photoUrl;
              const date = new Date(adoption.appliedAt).toLocaleDateString('pt-BR');
              return <Pressable key={adoption.id} onPress={() => adoption.animal && router.push({ pathname: '/adopet/[id]', params: { id: adoption.animal.id } })} className="bg-white rounded-2xl border border-line p-5 gap-4 active:opacity-80">
                <View className="flex-row gap-4 items-center">
                  {photo ? <Image source={{ uri: photo }} className="w-16 h-16 rounded-xl bg-peach" /> : <View className="w-16 h-16 rounded-xl bg-peach items-center justify-center"><PawPrintIcon size={28} color={palette.orange} /></View>}
                  <View className="flex-1 gap-1"><Text className="font-heading-bold text-xl text-ink">{adoption.animal?.name ?? 'Pet'}</Text><Text className="font-body text-sm text-ink-muted">Ficha enviada em {date}</Text></View>
                </View>
                <View className="rounded-xl p-4 flex-row gap-3 items-center" style={{ backgroundColor: info.background }}><Icon size={25} color={info.color} weight="fill" /><View className="flex-1 gap-1"><Text className="font-body-bold text-base" style={{ color: info.color }}>{info.label}</Text><Text className="font-body text-sm text-ink-muted">{info.description}</Text></View></View>
              </Pressable>;
            })}
    </ScrollView>
  );
}
