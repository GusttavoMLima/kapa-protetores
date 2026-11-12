import { useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowClockwiseIcon, ChatCircleDotsIcon, CheckCircleIcon, ClipboardTextIcon, HeartIcon, MagnifyingGlassIcon, PawPrintIcon, XIcon } from 'phosphor-react-native';
import type { AdoptionStatus } from '@kapa/shared';
import { DefaultHeader } from '@/components/header/default';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAdoptions } from '@/hooks/useAdoptions';
import { palette } from '@/theme';
import { BackLink } from '../animalManagement/components';
import { RequestAction } from './components';
import { filterRequests, type RequestFilter, statusLabels } from './model';
import { RequestCard } from './RequestCard';

export function AdoptionRequestsScreen() {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Redirect href="/(protected)/(tabs)" />;
  return <RequestsDashboard />;
}

function RequestsDashboard() {
  const { data: adoptions = [], isLoading, isFetching, error, refetch } = useAdminAdoptions();
  const [filter, setFilter] = useState<RequestFilter>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const filtered = filterRequests(adoptions, filter, search);
  const counts = adoptions.reduce<Record<AdoptionStatus, number>>((result, item) => { result[item.status]++; return result; }, { pending: 0, interviewing: 0, approved: 0, rejected: 0, canceled: 0 });
  const summaries = [
    { label: 'Total', value: adoptions.length, icon: ClipboardTextIcon },
    { label: 'Em análise', value: counts.pending, icon: PawPrintIcon },
    { label: 'Em contato', value: counts.interviewing, icon: ChatCircleDotsIcon },
    { label: 'Novos lares', value: counts.approved, icon: HeartIcon },
  ];
  const filters: readonly RequestFilter[] = ['all', 'pending', 'interviewing', 'approved', 'rejected', 'canceled'];
  function clearFilters() { setFilter('all'); setSearch(''); }

  return <View className="flex-1 bg-cream">
    <DefaultHeader />
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ width: '100%', maxWidth: 1140, alignSelf: 'center', padding: 20, paddingBottom: 48, gap: 24 }}>
      <BackLink label="Gestão do abrigo" />
      <View className="rounded-2xl bg-peach border border-line p-5 md:p-8 gap-3">
        <View className="flex-row items-center gap-2"><HeartIcon size={18} color={palette.denim} weight="fill" /><Text className="font-body-medium text-xs tracking-widest text-denim">CUIDADO EM CADA NOVO COMEÇO</Text></View>
        <Text accessibilityRole="header" className="font-heading-bold text-2xl md:text-3xl text-ink">Solicitações de adoção</Text>
        <Text className="max-w-form font-body text-base leading-6 text-ink-muted">Conheça as famílias, acompanhe as conversas e ajude cada pet a encontrar seu novo lar.</Text>
      </View>

      {!error ? <View className="flex-row gap-3">{summaries.map(({ label, value, icon: IconComponent }) => <View key={label} className="flex-1 min-w-0 rounded-xl border border-line bg-white p-3 md:p-4 gap-2">
        <View className="flex-row items-center justify-between gap-1"><Text className="font-heading-bold text-2xl text-denim">{isLoading ? '—' : value}</Text><IconComponent size={18} color={palette.denim} weight="duotone" /></View>
        <Text className="font-body-medium text-xs text-ink-muted">{label}</Text>
      </View>)}</View> : null}

      <View className="gap-4">
        <View className="flex-col md:flex-row md:items-center justify-between gap-2"><View className="gap-1"><Text accessibilityRole="header" className="font-heading-bold text-xl text-ink">Caixa de solicitações</Text><Text className="font-body text-sm text-ink-muted">As fichas em análise aparecem primeiro.</Text></View><RequestAction label="Atualizar solicitações" icon={ArrowClockwiseIcon} busy={isFetching} onPress={() => void refetch()} /></View>
        <View className="min-h-14 flex-row items-center gap-3 rounded-xl border border-line bg-white px-4"><MagnifyingGlassIcon size={22} color={palette.denim} /><TextInput accessibilityLabel="Buscar por família, pet ou cidade" placeholder="Busque uma família, pet ou cidade" placeholderTextColor={palette.inkMuted} value={search} onChangeText={setSearch} maxLength={120} className="flex-1 min-w-0 min-h-14 font-body text-sm text-ink" />{search ? <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setSearch('')} className="size-12 items-center justify-center"><XIcon size={18} color={palette.denim} /></Pressable> : null}</View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} accessibilityLabel="Filtrar solicitações por etapa">
          {filters.map((value) => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`Filtrar ${value === 'all' ? 'Todas' : statusLabels[value]}`} accessibilityState={{ selected: filter === value }} onPress={() => setFilter(value)} className={`min-h-12 flex-row items-center gap-2 rounded-full border px-4 py-3 ${filter === value ? 'bg-denim border-denim' : 'bg-white border-line hover:bg-peach'}`}><Text className={`font-body-medium text-sm ${filter === value ? 'text-white' : 'text-denim'}`}>{value === 'all' ? 'Todas' : statusLabels[value]}</Text><Text className={`font-body-medium text-xs ${filter === value ? 'text-white' : 'text-ink-muted'}`}>{isLoading ? '—' : value === 'all' ? adoptions.length : counts[value]}</Text></Pressable>)}
        </ScrollView>
      </View>

      {isLoading ? <View className="items-center gap-3 rounded-2xl bg-white border border-line p-10"><ActivityIndicator color={palette.orange} size="large" /><Text accessibilityLiveRegion="polite" className="font-body text-sm text-ink-muted">Carregando solicitações…</Text></View>
        : error ? <View className="rounded-2xl border border-line bg-white p-6 gap-4"><Text accessibilityRole="alert" className="font-heading-bold text-lg text-ink">Não foi possível carregar as solicitações.</Text><Text className="font-body text-sm leading-6 text-ink-muted">Confira sua conexão e tente novamente. Suas fichas continuam guardadas.</Text><RequestAction label="Tentar novamente" icon={ArrowClockwiseIcon} onPress={() => void refetch()} /></View>
          : filtered.length === 0 ? <View className="items-center rounded-2xl border border-line bg-white p-8 gap-4"><View className="size-16 rounded-full bg-peach items-center justify-center"><PawPrintIcon size={32} color={palette.denim} weight="duotone" /></View><Text accessibilityRole="header" className="font-heading-bold text-xl text-center text-ink">{adoptions.length ? 'Nenhuma ficha com esses filtros' : 'O próximo novo lar começa aqui'}</Text><Text className="max-w-form font-body text-sm text-center leading-6 text-ink-muted">{adoptions.length ? 'Experimente outro nome, pet ou etapa para encontrar a solicitação.' : 'Quando uma família enviar uma solicitação de adoção, você poderá conhecer a história dela por aqui.'}</Text>{adoptions.length ? <RequestAction label="Limpar filtros" onPress={clearFilters} /> : <View className="flex-row items-center gap-2"><CheckCircleIcon size={18} color={palette.denim} /><Text className="font-body-medium text-xs text-denim">Tudo em dia por aqui</Text></View>}</View>
            : <View className="gap-4"><Text accessibilityLiveRegion="polite" className="font-body text-xs text-ink-muted">{filtered.length} {filtered.length === 1 ? 'solicitação encontrada' : 'solicitações encontradas'}</Text>{filtered.map((adoption) => <RequestCard key={adoption.id} adoption={adoption} expanded={expandedId === adoption.id} onToggle={() => setExpandedId((current) => current === adoption.id ? null : adoption.id)} />)}</View>}
    </ScrollView>
  </View>;
}
