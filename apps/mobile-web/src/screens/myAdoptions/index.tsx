import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { CheckCircleIcon, ClockIcon, PawPrintIcon, XCircleIcon } from 'phosphor-react-native';
import { useMyAdoptions } from '@/hooks/useAdoptions';
import { palette } from '@/theme';
import { Page } from '@/components/layout/Page';
import { PrimaryButton } from '@/components/buttons/primary';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/ListStates';
import { PageHeading } from '@/components/layout/PageHeading';

const statusInfo = {
  pending: { label: 'Em análise', description: 'O abrigo ainda está avaliando a sua ficha.', color: palette.orangeDark, background: palette.peach, Icon: ClockIcon },
  interviewing: { label: 'Em contato', description: 'Sua ficha foi pré-aprovada. O abrigo entrará em contato para continuar o processo.', color: palette.denim, background: '#E4EEFA', Icon: ClockIcon },
  approved: { label: 'Adoção concluída', description: 'Parabéns! A adoção foi concluída pelo abrigo.', color: palette.success, background: palette.successSoft, Icon: CheckCircleIcon },
  rejected: { label: 'Não aprovada', description: 'Esta solicitação não foi aprovada pelo abrigo.', color: palette.danger, background: palette.dangerSoft, Icon: XCircleIcon },
  canceled: { label: 'Cancelada', description: 'Esta solicitação foi cancelada.', color: palette.inkMuted, background: '#EDEAE6', Icon: XCircleIcon },
};

export function MyAdoptionsScreen() {
  const { data: adoptions = [], isLoading, error, refetch } = useMyAdoptions();

  return (
    <Page backLabel="Perfil" onBack={() => router.replace('/(protected)/(tabs)/profile')}>
      <PageHeading eyebrow="SEU CAMINHO ATÉ UM NOVO AMIGO" title="Minhas solicitações" description="Cada etapa é um passo mais perto de um novo começo. Acompanhe aqui suas fichas e as respostas da equipe Kapa." />

      {isLoading ? <LoadingState message="Carregando solicitações…" />
        : error ? <ErrorState message="Não foi possível carregar suas solicitações. Verifique sua conexão e tente novamente." onRetry={() => void refetch()} />
          : adoptions.length === 0 ? <EmptyState icon={PawPrintIcon} title="Nenhuma solicitação ainda" description="Quando você enviar uma ficha de adoção, ela aparecerá aqui." action={<PrimaryButton title="Ver pets disponíveis" fullWidth={false} onPress={() => router.push('/adopet')} />} />
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
                <View className="rounded-xl p-4 flex-row gap-3 items-center" style={{ backgroundColor: info.background }}><Icon size={25} color={info.color} weight="fill" /><View className="flex-1 gap-1"><Text className="font-body-bold text-base" style={{ color: info.color }}>{info.label}</Text><Text className="font-body text-sm text-ink-muted">{adoption.status === 'interviewing' && adoption.contractSentAt ? 'O abrigo enviou o contrato. Confira o contato combinado.' : info.description}</Text></View></View>
              </Pressable>;
            })}
    </Page>
  );
}
