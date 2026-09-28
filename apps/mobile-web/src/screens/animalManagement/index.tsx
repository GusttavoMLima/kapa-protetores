import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MagnifyingGlassIcon, PawPrintIcon, PlusIcon, PencilSimpleIcon } from 'phosphor-react-native';
import type { AnimalManagementPage, AnimalStatus, Species } from '@kapa/shared';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/buttons/primary';
import { fetchManagedAnimals } from '@/services/animalManagement';
import { ApiError } from '@/services/api';
import { palette } from '@/theme';
import { AnimalThumbnail, BackLink, ChoiceGroup, Notice, StatusBadge, TextButton } from './components';
import { sizeLabel, speciesLabels, statusLabels } from './model';

export function AnimalManagementScreen() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<AnimalStatus | undefined>();
  const [species, setSpecies] = useState<Species | ''>('');
  const [sort, setSort] = useState<'recent' | 'name'>('recent');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AnimalManagementPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(() => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true); setError('');
    fetchManagedAnimals({ page, pageSize: 12, search: debouncedSearch, species: species || undefined, status, sort }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        const lastPage = Math.max(1, Math.ceil(result.total / result.pageSize));
        if (page > lastPage) { setPage(lastPage); return; }
        setData(result);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(err instanceof ApiError && [401, 403].includes(err.status)
          ? 'Sua sessão expirou ou seu perfil não tem mais acesso à gestão. Entre novamente.'
          : 'Não foi possível carregar os animais. Verifique sua conexão e tente novamente.');
      }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
  }, [page, debouncedSearch, species, status, sort]);

  useFocusEffect(useCallback(() => {
    load();
    return () => activeRequest.current?.abort();
  }, [load]));

  const total = data ? Object.values(data.counts).reduce((sum, count) => sum + count, 0) : 0;
  const filtered = Boolean(search || status || species);
  const clearFilters = () => { setSearch(''); setDebouncedSearch(''); setStatus(undefined); setSpecies(''); setPage(1); };
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return <SafeAreaView className="flex-1 bg-cream">
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="grow">
      <View className="w-full max-w-content self-center px-5 md:px-10 pb-10 pt-3 gap-6">
        <BackLink />
        <View className="flex-col md:flex-row md:items-center justify-between gap-6">
          <View className="flex-1 gap-2">
            <Text className="font-body-medium text-xs tracking-widest text-denim">GESTÃO DO ABRIGO</Text>
            <Text accessibilityRole="header" className="font-heading-bold text-2xl md:text-4xl text-ink">Cada cuidado conta.</Text>
            <Text className="font-body text-base text-ink-muted leading-6">Acompanhe os animais do abrigo, do resgate ao novo lar.</Text>
          </View>
          <PrimaryButton title="Cadastrar animal" fullWidth={false} textColor={palette.ink}
            icon={<PlusIcon size={20} color={palette.ink} />} onPress={() => router.push('/cadastro-animal')} />
        </View>
        <ScrollView horizontal contentContainerClassName="flex-row gap-3 md:grow" accessibilityLabel="Filtrar por acompanhamento">
          {([{ key: undefined, label: 'Todos os animais', count: total },
            ...(['rescued', 'treating', 'available', 'adopted'] as const).map((key) => ({ key, label: statusLabels[key], count: data?.counts[key] ?? 0 }))]).map((item) => (
            <Pressable key={item.key ?? 'all'} accessibilityRole="button" accessibilityState={{ selected: status === item.key }}
              accessibilityLabel={`${item.label}: ${item.count}`} onPress={() => { setStatus(item.key); setPage(1); }}
              className={`w-40 md:w-auto md:flex-1 min-h-24 rounded-lg border p-4 gap-2 ${status === item.key ? 'bg-denim border-denim' : 'bg-white border-border hover:bg-peach'}`}>
              <Text className={`font-heading-bold text-2xl ${status === item.key ? 'text-white' : 'text-denim'}`}>{data ? item.count : '—'}</Text>
              <Text className={`font-body-medium text-xs ${status === item.key ? 'text-white' : 'text-ink-muted'}`}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View className="bg-white rounded-xl border border-border overflow-hidden">
          <View className="p-5 md:p-6 gap-5">
            <View className="flex-col md:flex-row justify-between md:items-center gap-3">
              <View className="gap-1">
                <Text accessibilityRole="header" className="font-heading-bold text-xl text-ink">Animais do abrigo</Text>
                <Text className="font-body text-sm text-ink-muted">Informações organizadas para a rotina de quem cuida.</Text>
              </View>
              {filtered && <TextButton label="Limpar filtros" onPress={clearFilters} />}
            </View>
            <View className="flex-row items-center gap-3 border border-border bg-cream rounded-md px-4">
              <MagnifyingGlassIcon size={20} color={palette.denim} />
              <TextInput value={search} onChangeText={setSearch} maxLength={120} placeholder="Buscar por nome ou raça"
                accessibilityLabel="Buscar animais por nome ou raça" placeholderTextColor={palette.inkMuted}
                className="min-h-12 flex-1 py-3 font-body text-base text-ink" />
            </View>
            <View className="flex-col lg:flex-row lg:justify-between gap-5">
              <ChoiceGroup label="Espécie" value={species} options={[{ value: '', label: 'Todas' }, { value: 'dog', label: 'Cães' }, { value: 'cat', label: 'Gatos' }, { value: 'other', label: 'Outros' }]}
                onChange={(value) => { setSpecies(value); setPage(1); }} />
              <ChoiceGroup label="Ordenar por" value={sort} options={[{ value: 'recent', label: 'Mais recentes' }, { value: 'name', label: 'Nome A–Z' }]}
                onChange={(value) => { setSort(value); setPage(1); }} />
            </View>
          </View>
          {loading ? <View className="py-16 items-center gap-4"><ActivityIndicator color={palette.denim} /><Text accessibilityLiveRegion="polite" className="font-body text-ink-muted">Carregando animais…</Text></View>
            : error ? <View className="p-6 gap-4"><Notice message={error} error /><TextButton label="Tentar novamente" onPress={load} /></View>
              : data?.items.length ? <>
                <View className="hidden md:flex flex-row items-center px-6 py-3 bg-cream border-y border-border gap-5">
                  <Text className="flex-1 font-body-medium text-xs text-ink-muted">ANIMAL</Text>
                  <Text className="w-32 font-body-medium text-xs text-ink-muted">PORTE / SEXO</Text>
                  <Text className="w-40 font-body-medium text-xs text-ink-muted">ACOMPANHAMENTO</Text>
                  <Text className="w-24 text-right font-body-medium text-xs text-ink-muted">AÇÕES</Text>
                </View>
                {data.items.map((animal) => <View key={animal.id} className="p-5 md:px-6 flex-col md:flex-row md:items-center gap-4 md:gap-5 border-b border-border">
                  <View className="flex-row items-center gap-4 flex-1 min-w-0">
                    <AnimalThumbnail animal={animal} />
                    <View className="flex-1 gap-1">
                      <Text numberOfLines={1} className="font-heading-bold text-base text-ink">{animal.name}</Text>
                      <Text numberOfLines={1} className="font-body text-sm text-ink-muted">{speciesLabels[animal.species]} · {animal.breed || 'Raça não informada'}</Text>
                    </View>
                  </View>
                  <View className="md:w-32 gap-1"><Text className="font-body text-sm text-ink">{sizeLabel(animal.size)}</Text><Text className="font-body text-xs text-ink-muted">{animal.gender === 'female' ? 'Fêmea' : 'Macho'}</Text></View>
                  <View className="md:w-40"><StatusBadge status={animal.status} /></View>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${animal.name}`} onPress={() => router.push({ pathname: '/gestao/animais/[id]', params: { id: animal.id } })}
                    className="min-h-12 md:w-24 flex-row items-center justify-center gap-2 border border-border rounded-md px-3 hover:bg-peach active:bg-peach">
                    <PencilSimpleIcon size={18} color={palette.denim} /><Text className="font-body-medium text-sm text-denim">Editar</Text>
                  </Pressable>
                </View>)}
                <View className="p-5 gap-4 flex-col md:flex-row md:items-center justify-between">
                  <Text accessibilityLiveRegion="polite" className="font-body text-sm text-ink-muted">{(page - 1) * data.pageSize + 1}–{Math.min(page * data.pageSize, data.total)} de {data.total} animais</Text>
                  <View className="flex-row items-center gap-3 justify-between"><TextButton label="Anterior" disabled={page <= 1} onPress={() => setPage(page - 1)} /><Text className="font-body text-sm text-ink">{page} / {pages}</Text><TextButton label="Próxima" disabled={page >= pages} onPress={() => setPage(page + 1)} /></View>
                </View>
              </> : <View className="items-center px-6 py-16 gap-4">
                <View className="p-5 rounded-full bg-peach"><PawPrintIcon size={40} color={palette.denim} weight="duotone" /></View>
                <Text accessibilityRole="header" className="font-heading-bold text-xl text-ink text-center">{filtered ? 'Nenhum animal encontrado' : 'O próximo cuidado começa aqui'}</Text>
                <Text className="font-body text-sm text-ink-muted text-center max-w-form">{filtered ? 'Experimente outro nome ou ajuste os filtros para encontrar quem você procura.' : 'Cadastre o primeiro animal para acompanhar sua jornada no abrigo.'}</Text>
                {filtered ? <TextButton label="Limpar filtros" onPress={clearFilters} /> : <PrimaryButton title="Cadastrar primeiro animal" textColor={palette.ink} fullWidth={false} onPress={() => router.push('/cadastro-animal')} />}
              </View>}
        </View>
        <Text className="font-body text-xs text-ink-muted text-center">Cada registro atualizado ajuda a oferecer o cuidado certo.</Text>
      </View>
    </ScrollView>
  </SafeAreaView>;
}
