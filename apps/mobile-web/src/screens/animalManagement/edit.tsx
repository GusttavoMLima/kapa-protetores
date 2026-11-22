import { useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QueryClientContext } from '@tanstack/react-query';
import {
  createEmptyMedicationRecord,
  getMedicationValidationSummary,
  parseMedicationRecords,
  serializeMedicationRecords,
  type Animal,
  type MedicationRecord,
} from '@kapa/shared';
import { PrimaryButton } from '@/components/buttons/primary';
import { FormSubmissionLoader } from '@/components/feedback/FormSubmissionLoader';
import { DoseFields } from '@/components/forms/animal/DoseFields';
import { MedicationFields } from '@/components/forms/animal/MedicationFields';
import { PrimaryInputText } from '@/components/inputText/primary';
import { MultiFotoPicker } from '@/components/photoPicker/animal';
import { useHeaderOffset } from '@/hooks/useHeaderOffset';
import {
  fetchManagedAnimal,
  updateManagedAnimal,
} from '@/services/animalManagement';
import { uploadAnimalPhotos } from '@/storage/animals';
import { ApiError } from '@/services/api';
import { palette } from '@/theme';
import {
  AnimalThumbnail,
  BackLink,
  ChoiceGroup,
  Notice,
  StatusBadge,
  TextButton,
} from './components';
import {
  animalEditorSchema,
  animalEditorUpdate,
  editorValues,
  speciesOptions,
  statusOptions,
  triageOptions,
  type AnimalEditorValues,
} from './model';

const yesNoOptions = [
  { value: true, label: 'Sim' },
  { value: false, label: 'Não' },
] as const;

const energyOptions = [
  { value: 1, label: 'Muito calmo (1)' },
  { value: 2, label: 'Calmo (2)' },
  { value: 3, label: 'Moderado (3)' },
  { value: 4, label: 'Ativo (4)' },
  { value: 5, label: 'Alto (5)' },
] as const;

const noiseOptions = [
  { value: 1, label: 'Muito silencioso (1)' },
  { value: 2, label: 'Silencioso (2)' },
  { value: 3, label: 'Moderado (3)' },
  { value: 4, label: 'Vocal (4)' },
  { value: 5, label: 'Muito vocal (5)' },
] as const;

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <View className="bg-white border border-border rounded-2xl p-5 md:p-6 gap-5 shadow-card">
      <View className="gap-1">
        <Text
          accessibilityRole="header"
          className="font-heading-bold text-xl text-orange-dark"
        >
          {title}
        </Text>
        <Text className="font-body text-sm text-ink-muted">{description}</Text>
      </View>
      {children}
    </View>
  );
}

export function EditAnimalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AnimalEditor key={id} id={id} />;
}

function initialMedicationsFromNotes(
  notes: string | null | undefined,
): MedicationRecord[] {
  const parsed = parseMedicationRecords(notes).medications;
  return parsed.length > 0 ? parsed : [createEmptyMedicationRecord()];
}

function AnimalEditor({ id }: { id: string }) {
  const headerOffset = useHeaderOffset();
  const queryClient = useContext(QueryClientContext);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [values, setValues] = useState<AnimalEditorValues | null>(null);
  const [medications, setMedications] = useState<MedicationRecord[]>([
    createEmptyMedicationRecord(),
  ]);
  const [newPhotoUris, setNewPhotoUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [retry, setRetry] = useState(0);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const saveInFlight = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchManagedAnimal(id, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setAnimal(result);
          setValues(editorValues(result));
          setMedications(initialMedicationsFromNotes(result.medicationNotes));
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            err instanceof ApiError && err.status === 404
              ? 'Este animal não foi encontrado.'
              : err instanceof ApiError && [401, 403].includes(err.status)
                ? 'Sua sessão expirou ou seu perfil não tem acesso à gestão.'
                : 'Não foi possível carregar o cadastro. Tente novamente.',
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, retry]);

  const hasValueChanges = Boolean(
    animal &&
      values &&
      JSON.stringify(editorValues(animal)) !== JSON.stringify(values),
  );
  const dirty = hasValueChanges || newPhotoUris.length > 0;
  const leave = () =>
    router.canGoBack() ? router.back() : router.replace('/gestao/animais');
  const requestLeave = () => {
    if (dirty) setConfirmLeave(true);
    else leave();
  };

  const change = <K extends keyof AnimalEditorValues>(
    key: K,
    value: AnimalEditorValues[K],
  ) => {
    setValues((current) => (current ? { ...current, [key]: value } : current));
    setSuccess(false);
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const handleMedicationsChange = (nextMedications: MedicationRecord[]) => {
    setMedications(nextMedications);
    const serialized = serializeMedicationRecords(nextMedications);
    change('medicationNotes', serialized);
  };

  const save = async () => {
    if (!values || !animal || saveInFlight.current) return;
    setAttemptedSave(true);

    const medicationIssues = getMedicationValidationSummary(medications);
    const parsed = animalEditorSchema.safeParse(values);
    if (!parsed.success || medicationIssues.length > 0) {
      const nextErrors: Record<string, string> = {};
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          nextErrors[String(issue.path[0])] = issue.message;
        }
      }
      if (medicationIssues.length > 0) {
        nextErrors.medicationNotes =
          'Complete nome, dose, frequência e período (ou uso contínuo) dos medicamentos informados.';
      }
      setErrors(nextErrors);
      setError('Revise os campos indicados antes de salvar.');
      scroll.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    saveInFlight.current = true;
    setSaving(true);
    setError('');
    setErrors({});
    setSuccess(false);
    try {
      let result = hasValueChanges
        ? await updateManagedAnimal(id, animalEditorUpdate(animal, parsed.data))
        : animal;

      if (newPhotoUris.length > 0) {
        const uploadResult = await uploadAnimalPhotos(id, newPhotoUris);
        setNewPhotoUris(uploadResult.failures.map(({ uri }) => uri));
        if (uploadResult.uploaded > 0) {
          result = await fetchManagedAnimal(id);
        }
        if (uploadResult.failures.length > 0) {
          setError(
            `${uploadResult.uploaded} de ${newPhotoUris.length} novas fotos foram enviadas. ${uploadResult.failures[0].message}`,
          );
          setAnimal(result);
          setValues(editorValues(result));
          setMedications(initialMedicationsFromNotes(result.medicationNotes));
          await queryClient?.invalidateQueries({ queryKey: ['animals'] });
          await queryClient?.invalidateQueries({
            queryKey: ['animal-care-profile'],
          });
          return;
        }
      }

      setAnimal(result);
      setValues(editorValues(result));
      setMedications(initialMedicationsFromNotes(result.medicationNotes));
      setAttemptedSave(false);
      setSuccess(true);
      await queryClient?.invalidateQueries({ queryKey: ['animals'] });
      await queryClient?.invalidateQueries({
        queryKey: ['animal-care-profile'],
      });
    } catch (err: unknown) {
      setError(
        err instanceof ApiError && [401, 403].includes(err.status)
          ? 'Você não tem acesso para salvar. Entre novamente; suas alterações ainda estão nesta tela.'
          : 'Não foi possível salvar. Suas alterações foram mantidas; tente novamente.',
      );
    } finally {
      setSaving(false);
      saveInFlight.current = false;
      scroll.current?.scrollTo({ y: 0, animated: true });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['left', 'right']}>
      <KeyboardAvoidingView
        className="flex-1 bg-cream"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={headerOffset}
      >
        <ScrollView
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-content self-center px-5 md:px-10 pt-3 pb-10 gap-6">
            <BackLink
              label="Animais do abrigo"
              onPress={() => {
                if (!saving) requestLeave();
              }}
            />
            <View className="gap-2">
              <Text className="font-body-medium text-xs tracking-widest text-denim">
                GESTÃO DO ABRIGO
              </Text>
              <Text
                accessibilityRole="header"
                className="font-heading-bold text-2xl md:text-4xl text-ink"
              >
                Edição de animal
              </Text>
              <Text className="font-body text-base text-ink-muted">
                Mantenha fotos, vacinas, doses, medicamentos e perfil atualizados para toda a equipe e adotantes.
              </Text>
            </View>
            {error ? <Notice message={error} error /> : null}
            {success ? (
              <Notice message="Alterações salvas com sucesso. O cadastro já está atualizado para a equipe." />
            ) : null}
            {loading ? (
              <ActivityIndicator
                accessibilityLabel="Carregando cadastro"
                color={palette.denim}
              />
            ) : !animal || !values ? (
              <TextButton
                label="Tentar novamente"
                onPress={() => {
                  setLoading(true);
                  setError('');
                  setRetry((value) => value + 1);
                }}
              />
            ) : (
              <>
                <View className="flex-row items-center gap-4 rounded-2xl bg-peach p-5">
                  <AnimalThumbnail animal={animal} />
                  <View className="flex-1 min-w-0 gap-2">
                    <Text className="font-heading-bold text-xl text-ink">
                      {animal.name}
                    </Text>
                    <StatusBadge status={animal.status} />
                  </View>
                </View>

                <Section
                  title="Fotos do animal"
                  description="Visualize as fotos salvas e adicione novas imagens (a primeira nova foto enviada torna-se a capa)."
                >
                  {animal.photos && animal.photos.length > 0 ? (
                    <View className="gap-2">
                      <Text className="font-body-medium text-xs text-ink-muted">
                        Fotos salvas no cadastro ({animal.photos.length})
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12 }}
                      >
                        {animal.photos.map((photo, index) => (
                          <View
                            key={photo.id}
                            className="relative w-28 h-28 rounded-2xl overflow-hidden border border-border bg-cream"
                          >
                            <Image
                              source={{ uri: photo.photoUrl }}
                              accessibilityLabel={`Foto atual ${index + 1} de ${animal.name}`}
                              className="w-full h-full"
                              style={{ width: '100%', height: '100%' }}
                              resizeMode="cover"
                            />
                            {index === 0 ? (
                              <View className="absolute bottom-1.5 left-1.5 bg-denim/90 px-2 py-0.5 rounded-full">
                                <Text className="font-body-medium text-[10px] text-white">
                                  Capa atual
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  ) : (
                    <Text className="font-body text-sm text-ink-muted">
                      Nenhuma foto enviada até o momento.
                    </Text>
                  )}
                  <MultiFotoPicker
                    uris={newPhotoUris}
                    disabled={saving}
                    label="Novas fotos"
                    onChange={(nextUris) => {
                      setNewPhotoUris(nextUris);
                      setSuccess(false);
                    }}
                  />
                </Section>

                <Section
                  title="Quem é"
                  description="As informações essenciais para reconhecer e acompanhar o animal."
                >
                  <View className="flex-col md:flex-row gap-4">
                    <PrimaryInputText
                      className="flex-1"
                      label="Nome *"
                      value={values.name}
                      onChangeText={(value) => change('name', value)}
                      erro={errors.name}
                      maxLength={120}
                      editable={!saving}
                    />
                    <PrimaryInputText
                      className="flex-1"
                      label="Raça"
                      value={values.breed}
                      onChangeText={(value) => change('breed', value)}
                      placeholder="Ex.: sem raça definida"
                      maxLength={120}
                      editable={!saving}
                    />
                  </View>
                  <ChoiceGroup
                    label="Espécie"
                    options={speciesOptions}
                    value={values.species}
                    onChange={(value) => change('species', value)}
                    disabled={saving}
                  />
                  <ChoiceGroup
                    label="Sexo"
                    options={[
                      { value: 'male', label: 'Macho' },
                      { value: 'female', label: 'Fêmea' },
                    ]}
                    value={values.gender}
                    onChange={(value) => change('gender', value)}
                    disabled={saving}
                  />
                  <ChoiceGroup
                    label="Porte"
                    options={[
                      { value: 1, label: 'Muito pequeno' },
                      { value: 2, label: 'Pequeno' },
                      { value: 3, label: 'Médio' },
                      { value: 4, label: 'Grande' },
                      { value: 5, label: 'Muito grande' },
                    ]}
                    value={values.size}
                    onChange={(value) => change('size', value)}
                    disabled={saving}
                  />
                  <View className="flex-col md:flex-row gap-4">
                    <PrimaryInputText
                      className="flex-1"
                      label="Idade aproximada (anos) *"
                      value={values.age}
                      onChangeText={(value) => change('age', value)}
                      erro={errors.age}
                      keyboardType="number-pad"
                      maxLength={3}
                      editable={!saving}
                    />
                    <PrimaryInputText
                      className="flex-1"
                      label="Peso (kg) *"
                      value={values.weightKg}
                      onChangeText={(value) => change('weightKg', value)}
                      erro={errors.weightKg}
                      keyboardType="decimal-pad"
                      maxLength={8}
                      editable={!saving}
                    />
                  </View>
                </Section>

                <Section
                  title="Resgate"
                  description="Dados sobre a chegada do animal ao abrigo."
                >
                  <View className="flex-col md:flex-row gap-4">
                    <PrimaryInputText
                      className="flex-1"
                      label="Data do resgate"
                      value={values.rescuedAt}
                      onChangeText={(value) => change('rescuedAt', value)}
                      erro={errors.rescuedAt}
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
                      editable={!saving}
                    />
                    <PrimaryInputText
                      className="flex-1"
                      label="Local do resgate (uso interno)"
                      value={values.place}
                      onChangeText={(value) => change('place', value)}
                      placeholder="Rua, bairro ou ponto de referência"
                      maxLength={240}
                      editable={!saving}
                    />
                  </View>
                  <ChoiceGroup
                    label="Condição na chegada / saúde"
                    value={values.healthCondition}
                    options={[
                      { value: 'healthy', label: 'Saudável' },
                      { value: 'injured', label: 'Ferido' },
                      { value: 'debilitated', label: 'Debilitado' },
                    ]}
                    onChange={(value) => change('healthCondition', value)}
                    disabled={saving}
                  />
                </Section>

                <Section
                  title="Saúde"
                  description="Castração, vacinas, doses aplicadas e medicamentos em uso."
                >
                  <ChoiceGroup
                    label="Castrado"
                    value={values.castrated}
                    options={triageOptions}
                    onChange={(value) => change('castrated', value)}
                    disabled={saving}
                  />
                  {!values.vermifugoDoses.length ? (
                    <ChoiceGroup
                      label="Vermifugado"
                      value={values.dewormed}
                      options={triageOptions}
                      onChange={(value) => change('dewormed', value)}
                      disabled={saving}
                    />
                  ) : null}
                  {!values.v10Doses.length && !values.vacinaRaivaDoses.length ? (
                    <ChoiceGroup
                      label="Vacinação registrada"
                      value={values.vaccinated}
                      options={yesNoOptions}
                      onChange={(value) => change('vaccinated', value)}
                      disabled={saving}
                    />
                  ) : null}
                  <DoseFields
                    label="Vacina V10"
                    addLabel="Adicionar dose da V10"
                    doses={values.v10Doses}
                    onChange={(doses) => change('v10Doses', doses)}
                    showErrors={attemptedSave || Boolean(errors.v10Doses)}
                    disabled={saving}
                  />
                  <DoseFields
                    label="Vacina antirrábica"
                    addLabel="Adicionar dose antirrábica"
                    doses={values.vacinaRaivaDoses}
                    onChange={(doses) => change('vacinaRaivaDoses', doses)}
                    showErrors={
                      attemptedSave || Boolean(errors.vacinaRaivaDoses)
                    }
                    disabled={saving}
                  />
                  <DoseFields
                    label="Vermífugo"
                    addLabel="Adicionar dose de vermífugo"
                    doses={values.vermifugoDoses}
                    onChange={(doses) => change('vermifugoDoses', doses)}
                    showErrors={attemptedSave || Boolean(errors.vermifugoDoses)}
                    disabled={saving}
                  />
                  <MedicationFields
                    medications={medications}
                    onChange={handleMedicationsChange}
                    showErrors={
                      attemptedSave || Boolean(errors.medicationNotes)
                    }
                    disabled={saving}
                    erro={errors.medicationNotes}
                  />
                </Section>

                <Section
                  title="Temperamento"
                  description="Comportamento, humor, nível de energia e ruído do animal."
                >
                  <PrimaryInputText
                    label="Temperamento / humor *"
                    value={values.mood}
                    onChangeText={(value) => change('mood', value)}
                    placeholder="Ex.: Dócil, tranquilo, brincalhão"
                    erro={errors.mood}
                    maxLength={120}
                    editable={!saving}
                  />
                  <ChoiceGroup
                    label="Nível de energia"
                    options={energyOptions}
                    value={values.energyLevel}
                    onChange={(value) => change('energyLevel', value)}
                    disabled={saving}
                  />
                  <ChoiceGroup
                    label="Nível de ruído"
                    options={noiseOptions}
                    value={values.noiseLevel ?? 3}
                    onChange={(value) => change('noiseLevel', value)}
                    disabled={saving}
                  />
                </Section>

                <Section
                  title="Compatibilidade"
                  description="Como o animal se adapta à convivência e à moradia."
                >
                  <ChoiceGroup
                    label="Com crianças (0 a 5)"
                    options={[0, 1, 2, 3, 4, 5].map((value) => ({
                      value,
                      label: String(value),
                    }))}
                    value={values.kidFriendly}
                    onChange={(value) => change('kidFriendly', value)}
                    disabled={saving}
                  />
                  <ChoiceGroup
                    label="Com outros animais"
                    options={yesNoOptions}
                    value={values.otherPetFriendly}
                    onChange={(value) => change('otherPetFriendly', value)}
                    disabled={saving}
                  />
                  <ChoiceGroup
                    label="Para apartamento"
                    options={yesNoOptions}
                    value={values.apartmentFriendly}
                    onChange={(value) => change('apartmentFriendly', value)}
                    disabled={saving}
                  />
                </Section>

                <Section
                  title="Acompanhamento"
                  description="Somente animais com status Disponível aparecem na consulta de adoção."
                >
                  <ChoiceGroup
                    label="Status do animal"
                    options={statusOptions}
                    value={values.status}
                    onChange={(value) => change('status', value)}
                    disabled={saving}
                  />
                  <PrimaryInputText
                    label="Observações"
                    value={values.observations}
                    onChangeText={(value) => change('observations', value)}
                    placeholder="História do animal, cuidados ou informações úteis"
                    multiline
                    maxLength={4000}
                    editable={!saving}
                  />
                </Section>

                <View className="gap-4 flex-col md:flex-row md:items-center justify-between">
                  <Text
                    accessibilityLiveRegion="polite"
                    className="font-body text-sm text-ink-muted"
                  >
                    {dirty
                      ? 'Há alterações ainda não salvas.'
                      : 'Altere algum dado do animal para salvar.'}
                  </Text>
                  <View className="flex-col md:flex-row gap-3">
                    <TextButton
                      label="Voltar à listagem"
                      onPress={requestLeave}
                      disabled={saving}
                    />
                    <PrimaryButton
                      title="Salvar alterações"
                      fullWidth={false}
                      onPress={() => void save()}
                      loading={saving}
                      disabled={!dirty}
                      disabledReason="Altere algum dado do animal para salvar."
                    />
                  </View>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <FormSubmissionLoader
        visible={saving}
        message="Salvando alterações do animal…"
      />
      <Modal
        visible={confirmLeave}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmLeave(false)}
      >
        <View className="flex-1 items-center justify-center bg-denim/50 p-5">
          <View
            accessibilityViewIsModal
            className="w-full max-w-form bg-white rounded-xl p-6 gap-5"
          >
            <Text
              accessibilityRole="header"
              className="font-heading-bold text-xl text-ink"
            >
              Sair sem salvar?
            </Text>
            <Text className="font-body text-base text-ink-muted">
              As alterações feitas neste cadastro serão descartadas.
            </Text>
            <TextButton
              label="Continuar editando"
              onPress={() => setConfirmLeave(false)}
            />
            <TextButton label="Descartar alterações" onPress={leave} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
