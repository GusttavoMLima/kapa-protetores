import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Animal } from '@kapa/shared';
import { PrimaryButton } from '@/components/buttons/primary';
import { PrimaryInputText } from '@/components/inputText/primary';
import { fetchManagedAnimal, updateManagedAnimal } from '@/services/animalManagement';
import { ApiError } from '@/services/api';
import { palette } from '@/theme';
import { AnimalThumbnail, BackLink, ChoiceGroup, Notice, StatusBadge, TextButton } from './components';
import { animalEditorSchema, editorValues, speciesOptions, statusOptions, triageOptions, type AnimalEditorValues } from './model';

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <View className="bg-white border border-border rounded-lg p-5 md:p-6 gap-5">
    <View className="gap-1"><Text accessibilityRole="header" className="font-heading-bold text-xl text-ink">{title}</Text><Text className="font-body text-sm text-ink-muted">{description}</Text></View>
    {children}
  </View>;
}

export function EditAnimalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AnimalEditor key={id} id={id} />;
}

function AnimalEditor({ id }: { id: string }) {
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [values, setValues] = useState<AnimalEditorValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [retry, setRetry] = useState(0);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const saveInFlight = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    fetchManagedAnimal(id, controller.signal).then((result) => {
      if (!controller.signal.aborted) { setAnimal(result); setValues(editorValues(result)); }
    }).catch((err: unknown) => {
      if (!controller.signal.aborted) setError(err instanceof ApiError && err.status === 404 ? 'Este animal não foi encontrado.'
        : err instanceof ApiError && [401, 403].includes(err.status) ? 'Sua sessão expirou ou seu perfil não tem acesso à gestão.'
          : 'Não foi possível carregar o cadastro. Tente novamente.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, retry]);
  const dirty = Boolean(animal && values && JSON.stringify(editorValues(animal)) !== JSON.stringify(values));
  const leave = () => router.canGoBack() ? router.back() : router.replace('/gestao/animais');
  const requestLeave = () => { if (dirty) setConfirmLeave(true); else leave(); };
  const change = <K extends keyof AnimalEditorValues>(key: K, value: AnimalEditorValues[K]) => {
    setValues((current) => current ? { ...current, [key]: value } : current);
    setSuccess(false); setErrors((current) => ({ ...current, [key]: '' }));
  };
  const save = async () => {
    if (!values || saveInFlight.current) return;
    const parsed = animalEditorSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) nextErrors[String(issue.path[0])] = issue.message;
      setErrors(nextErrors); setError('Revise os campos indicados antes de salvar.');
      scroll.current?.scrollTo({ y: 0, animated: true }); return;
    }
    saveInFlight.current = true; setSaving(true); setError(''); setErrors({}); setSuccess(false);
    try {
      const result = await updateManagedAnimal(id, parsed.data);
      setAnimal(result); setValues(editorValues(result)); setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof ApiError && [401, 403].includes(err.status) ? 'Você não tem acesso para salvar. Entre novamente; suas alterações ainda estão nesta tela.'
        : 'Não foi possível salvar. Suas alterações foram mantidas; tente novamente.');
    } finally {
      setSaving(false); saveInFlight.current = false; scroll.current?.scrollTo({ y: 0, animated: true });
    }
  };

  return <SafeAreaView className="flex-1 bg-cream">
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled">
      <View className="w-full max-w-content self-center px-5 md:px-10 pt-3 pb-10 gap-6">
        <BackLink label="Animais do abrigo" onPress={() => { if (!saving) requestLeave(); }} />
        <View className="gap-2"><Text className="font-body-medium text-xs tracking-widest text-denim">GESTÃO DO ABRIGO</Text><Text accessibilityRole="header" className="font-heading-bold text-2xl md:text-4xl text-ink">Um cadastro, muitos cuidados.</Text><Text className="font-body text-base text-ink-muted">Mantenha as informações deste animal atualizadas para toda a equipe.</Text></View>
        {error ? <Notice message={error} error /> : null}
        {success ? <Notice message="Alterações salvas com sucesso. O cadastro já está atualizado para a equipe." /> : null}
        {loading ? <ActivityIndicator accessibilityLabel="Carregando cadastro" color={palette.denim} /> : !animal || !values
          ? <TextButton label="Tentar novamente" onPress={() => { setLoading(true); setError(''); setRetry((value) => value + 1); }} />
          : <>
            <View className="flex-row items-center gap-4 rounded-lg bg-peach p-5">
              <AnimalThumbnail animal={animal} /><View className="flex-1 gap-2"><Text className="font-heading-bold text-xl text-ink">{animal.name}</Text><StatusBadge status={animal.status} /></View>
            </View>
            <Section title="Identificação" description="As informações essenciais para reconhecer e acompanhar o animal.">
              <View className="flex-col md:flex-row gap-4">
                <PrimaryInputText className="flex-1" label="Nome *" value={values.name} onChangeText={(value) => change('name', value)} erro={errors.name} maxLength={120} editable={!saving} />
                <PrimaryInputText className="flex-1" label="Raça" value={values.breed} onChangeText={(value) => change('breed', value)} maxLength={120} editable={!saving} />
              </View>
              <ChoiceGroup label="Espécie" options={speciesOptions} value={values.species} onChange={(value) => change('species', value)} disabled={saving} />
              <ChoiceGroup label="Sexo" options={[{ value: 'male', label: 'Macho' }, { value: 'female', label: 'Fêmea' }]} value={values.gender} onChange={(value) => change('gender', value)} disabled={saving} />
              <View className="flex-col md:flex-row gap-4">
                <PrimaryInputText className="flex-1" label="Idade aproximada (anos) *" value={values.age} onChangeText={(value) => change('age', value)} erro={errors.age} keyboardType="number-pad" maxLength={3} editable={!saving} />
                <PrimaryInputText className="flex-1" label="Peso (kg) *" value={values.weightKg} onChangeText={(value) => change('weightKg', value)} erro={errors.weightKg} keyboardType="decimal-pad" maxLength={8} editable={!saving} />
              </View>
              <ChoiceGroup label="Porte" options={[{ value: 1, label: 'Muito pequeno' }, { value: 2, label: 'Pequeno' }, { value: 3, label: 'Médio' }, { value: 4, label: 'Grande' }, { value: 5, label: 'Muito grande' }]} value={values.size} onChange={(value) => change('size', value)} disabled={saving} />
            </Section>
            <Section title="Acompanhamento" description="Somente animais com status Disponível aparecem na consulta de adoção.">
              <ChoiceGroup label="Status do animal" options={statusOptions} value={values.status} onChange={(value) => change('status', value)} disabled={saving} />
              <PrimaryInputText label="Local do resgate (uso interno)" value={values.place} onChangeText={(value) => change('place', value)} maxLength={240} editable={!saving} />
              <Text className="font-body text-sm text-ink-muted">Data do resgate: {new Date(animal.rescuedAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Text>
            </Section>
            <Section title="Saúde e bem-estar" description="Um resumo dos cuidados registrados. Não substitui o histórico veterinário.">
              <ChoiceGroup label="Condição de saúde" value={values.healthCondition} options={[{ value: 'healthy', label: 'Saudável' }, { value: 'injured', label: 'Ferido' }, { value: 'debilitated', label: 'Debilitado' }]} onChange={(value) => change('healthCondition', value)} disabled={saving} />
              <ChoiceGroup label="Castrado" value={values.castrated} options={triageOptions} onChange={(value) => change('castrated', value)} disabled={saving} />
              <ChoiceGroup label="Vermifugado" value={values.dewormed} options={triageOptions} onChange={(value) => change('dewormed', value)} disabled={saving} />
              <ChoiceGroup label="Vacinação registrada" value={values.vaccinated} options={[{ value: true, label: 'Sim' }, { value: false, label: 'Não' }]} onChange={(value) => change('vaccinated', value)} disabled={saving} />
              <PrimaryInputText label="Temperamento *" value={values.mood} onChangeText={(value) => change('mood', value)} erro={errors.mood} maxLength={120} editable={!saving} />
              <PrimaryInputText label="Observações internas" value={values.observations} onChangeText={(value) => change('observations', value)} multiline maxLength={4000} editable={!saving} />
            </Section>
            <View className="gap-4 flex-col md:flex-row md:items-center justify-between">
              <Text accessibilityLiveRegion="polite" className="font-body text-sm text-ink-muted">{dirty ? 'Há alterações ainda não salvas.' : 'Todas as informações estão salvas.'}</Text>
              <View className="flex-col md:flex-row gap-3"><TextButton label="Voltar à listagem" onPress={requestLeave} disabled={saving} /><PrimaryButton title="Salvar alterações" fullWidth={false} textColor={palette.ink} onPress={save} loading={saving} disabled={!dirty} /></View>
            </View>
          </>}
      </View>
    </ScrollView>
    <Modal visible={confirmLeave} transparent animationType="fade" onRequestClose={() => setConfirmLeave(false)}>
      <View className="flex-1 items-center justify-center bg-denim/50 p-5"><View accessibilityViewIsModal className="w-full max-w-form bg-white rounded-xl p-6 gap-5">
        <Text accessibilityRole="header" className="font-heading-bold text-xl text-ink">Sair sem salvar?</Text><Text className="font-body text-base text-ink-muted">As alterações feitas neste cadastro serão descartadas.</Text>
        <TextButton label="Continuar editando" onPress={() => setConfirmLeave(false)} /><TextButton label="Descartar alterações" onPress={leave} />
      </View></View>
    </Modal>
  </SafeAreaView>;
}
