import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { z } from 'zod';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClipboardTextIcon,
  ClockIcon,
  MapPinIcon,
  PlusIcon,
  UsersThreeIcon,
} from 'phosphor-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { kapaService } from '@/services/kapaService';
import { DefaultHeader } from '@/components/header/default';
import { PrimaryButton } from '@/components/buttons/primary';
import { PrimaryChipGroup } from '@/components/chips/primaryChip';
import { DateTimeField } from '@/components/inputDateTime';
import { PrimaryInputText } from '@/components/inputText/primary';
import type {
  CommunityEventListItem,
  CommunityEventType,
  CreateCommunityEventInput,
} from '@kapa/shared';
import { palette } from '@/theme';
import { styles } from './styles';

type Feedback = { kind: 'success' | 'error'; message: string } | undefined;

const activitySchema = z.object({
  id: z.string().cuid(),
  title: z.string(),
  description: z.string(),
  cep: z.number().int(),
  type: z.enum(['care', 'cleaning', 'event', 'transport']),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().nullable(),
  location: z.string().nullable(),
  vacancies: z.number().int().nullable(),
  createdAt: z.string().datetime(),
  isSignedUp: z.boolean(),
  volunteerCount: z.number().int().nonnegative(),
  remainingVacancies: z.number().int().nonnegative().nullable(),
});

const activitiesResponseSchema = z.object({ success: z.literal(true), data: z.array(activitySchema) });
const activityResponseSchema = z.object({ success: z.literal(true), data: activitySchema });

const activityTypeOptions: { value: CommunityEventType; label: string }[] = [
  { value: 'care', label: 'Cuidados' },
  { value: 'cleaning', label: 'Limpeza' },
  { value: 'event', label: 'Evento' },
  { value: 'transport', label: 'Transporte' },
];

const activityTypeLabels: Record<CommunityEventType, string> = {
  care: 'Cuidados',
  cleaning: 'Limpeza',
  event: 'Evento',
  transport: 'Transporte',
};

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const body: unknown = error.response?.data;
    if (typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string') {
      return body.error;
    }
  }
  return 'Não foi possível concluir a solicitação. Tente novamente.';
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}

function formatCep(value: number): string {
  const digits = String(value).padStart(8, '0');
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function ActivitiesScreen() {
  const { user } = useAuth();
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [activities, setActivities] = useState<CommunityEventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>();
  const [attempted, setAttempted] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [cep, setCep] = useState('');
  const [vacancies, setVacancies] = useState('');
  const [type, setType] = useState<CommunityEventType>('care');

  const canManageActivities = user?.role === 'admin' || user?.role === 'protector';
  const endTimeError = attempted && !/^\d{2}:\d{2}$/.test(endTime)
    ? 'Informe o horário de término.'
    : undefined;
  const titleError = attempted && !title.trim() ? 'Informe o título da atividade.' : undefined;
  const dateError = attempted && !/^\d{4}-\d{2}-\d{2}$/.test(date) ? 'Use o formato AAAA-MM-DD.' : undefined;
  const startTimeError = attempted && !/^\d{2}:\d{2}$/.test(startTime) ? 'Use o formato HH:MM.' : undefined;
  const vacanciesError = attempted && (!Number.isInteger(Number(vacancies)) || Number(vacancies) < 1)
    ? 'Informe pelo menos uma vaga.'
    : undefined;
  const locationError = attempted && !location.trim() ? 'Informe o local.' : undefined;
  const cepError = attempted && !/^\d{8}$/.test(cep.replace(/\D/g, ''))
    ? 'Informe um CEP com 8 dígitos.'
    : undefined;

  useEffect(() => {
    let active = true;
    kapaService.get<unknown>('/community-events/manage')
      .then((response) => {
        const parsed = activitiesResponseSchema.safeParse(response.data);
        if (!parsed.success) throw new Error('A resposta de atividades recebida é inválida.');
        if (active) setActivities(parsed.data.data);
      })
      .catch((error: unknown) => {
        if (active) setFeedback({ kind: 'error', message: getErrorMessage(error) });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  function resetForm() {
    setTitle('');
    setDescription('');
    setDate('');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setCep('');
    setVacancies('');
    setType('care');
    setAttempted(false);
  }

  function returnToList() {
    resetForm();
    setFeedback(undefined);
    setMode('list');
  }

  async function handleSave() {
    setAttempted(true);
    setFeedback(undefined);

    if (titleError || dateError || startTimeError || endTimeError || vacanciesError || locationError || cepError) return;

    setSaving(true);
    try {
      const startAt = new Date(`${date}T${startTime}:00`);
      const endAt = new Date(`${date}T${endTime}:00`);
      if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()) || endAt <= startAt) {
        setFeedback({ kind: 'error', message: 'O término precisa ocorrer após o início no mesmo dia.' });
        return;
      }

      const input: CreateCommunityEventInput = {
        title: title.trim(),
        description: description.trim(),
        cep: Number(cep.replace(/\D/g, '')),
        type,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        location: location.trim(),
        vacancies: Number(vacancies),
      };
      const response = await kapaService.post<unknown>('/community-events', input);
      const parsed = activityResponseSchema.safeParse(response.data);
      if (!parsed.success) throw new Error('A resposta de atividade recebida é inválida.');
      setActivities((current) => [...current, parsed.data.data].sort((a, b) => a.startAt.localeCompare(b.startAt)));
      resetForm();
      setMode('list');
      setFeedback({ kind: 'success', message: 'Atividade cadastrada e disponível para os voluntários.' });
    } catch (error) {
      setFeedback({ kind: 'error', message: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  if (!canManageActivities) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <DefaultHeader />
        <View style={styles.restricted}>
          <View style={styles.restrictedIcon}>
            <ClipboardTextIcon size={30} color={palette.orange} weight="fill" />
          </View>
          <Text style={styles.title}>Área do protetor</Text>
          <Text style={styles.restrictedText}>
            Apenas perfis de protetor ou administrador podem organizar atividades.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <DefaultHeader />
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {mode === 'list' ? (
            <>
              <Pressable
                style={styles.backButton}
                onPress={() => router.replace('/')}
                accessibilityRole="button"
                accessibilityLabel="Voltar ao início"
              >
                <ArrowLeftIcon size={20} color={palette.denim} weight="bold" />
                <Text style={styles.backButtonText}>Voltar ao início</Text>
              </Pressable>
              <View style={styles.hero}>
                <View style={styles.heroIcon}>
                  <CalendarIcon size={28} color={palette.orange} weight="fill" />
                </View>
                <View style={styles.heroCopy}>
                  <Text style={styles.title}>Atividades da semana</Text>
                  <Text style={styles.subtitle}>Organize as ações e prepare as vagas para os voluntários.</Text>
                </View>
              </View>

              {feedback ? (
                <View style={[styles.feedback, feedback.kind === 'error' && styles.feedbackError]} accessibilityLiveRegion="polite">
                  <Text style={[styles.feedbackText, feedback.kind === 'error' && styles.feedbackErrorText]}>{feedback.message}</Text>
                </View>
              ) : null}

              <PrimaryButton title="Nova atividade" icon={<PlusIcon size={20} color={palette.white} weight="bold" />} onPress={() => { setFeedback(undefined); setMode('form'); }} />

              {loading ? (
                <View style={styles.loading}><ActivityIndicator size="large" color={palette.orange} /></View>
              ) : activities.length === 0 ? (
                <View style={styles.emptyCard}>
                  <ClipboardTextIcon size={36} color={palette.orange} weight="duotone" />
                  <Text style={styles.emptyTitle}>Nenhuma atividade cadastrada</Text>
                  <Text style={styles.emptyText}>Cadastre a primeira atividade para organizar a semana da Kapa.</Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {activities.map((activity) => (
                    <View key={activity.id} style={styles.activityCard}>
                      <View style={styles.activityHeader}>
                        <View style={styles.typeTag}><Text style={styles.typeTagText}>{activityTypeLabels[activity.type]}</Text></View>
                      <Text style={styles.vacancies}>{activity.volunteerCount}/{activity.vacancies ?? '∞'} inscritos</Text>
                      </View>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      {activity.description ? <Text style={styles.activityDescription}>{activity.description}</Text> : null}
                      <View style={styles.activityDetails}>
                        <View style={styles.detail}><CalendarIcon size={18} color={palette.denim} /><Text style={styles.detailText}>{formatDate(activity.startAt)}</Text></View>
                        {activity.endAt ? <View style={styles.detail}><ClockIcon size={18} color={palette.denim} /><Text style={styles.detailText}>Término: {formatDate(activity.endAt)}</Text></View> : null}
                        <View style={styles.detail}><MapPinIcon size={18} color={palette.denim} /><Text style={styles.detailText}>{activity.location ? `${activity.location} · CEP ${formatCep(activity.cep)}` : `CEP ${formatCep(activity.cep)}`}</Text></View>
                        <View style={styles.detail}><UsersThreeIcon size={18} color={palette.denim} /><Text style={styles.detailText}>{activity.remainingVacancies === null ? 'Vagas disponíveis sem limite definido' : `${activity.remainingVacancies} vagas disponíveis`}</Text></View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <>
              <Pressable style={styles.backButton} onPress={returnToList} accessibilityRole="button" accessibilityLabel="Voltar para atividades">
                <ArrowLeftIcon size={20} color={palette.denim} weight="bold" />
                <Text style={styles.backButtonText}>Voltar</Text>
              </Pressable>
              <View style={styles.formHeading}>
                <Text style={styles.title}>Nova atividade</Text>
                <Text style={styles.subtitle}>Preencha os dados para disponibilizá-la aos voluntários.</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.section}>Sobre a atividade</Text>
                <PrimaryInputText label="Título" value={title} onChangeText={setTitle} placeholder="Ex.: Passeio com os cães" erro={titleError} maxLength={120} />
                <PrimaryInputText label="Descrição" value={description} onChangeText={setDescription} placeholder="Explique o que será feito e o que levar" multiline maxLength={2000} />
                <Text style={styles.fieldLabel}>Tipo de ajuda</Text>
                <PrimaryChipGroup options={activityTypeOptions} value={type} onChange={setType} />
              </View>
              <View style={styles.card}>
                <Text style={styles.section}>Quando e onde</Text>
                <DateTimeField label="Data" value={date} onChange={setDate} mode="date" error={dateError} />
                <View style={styles.timeRow}>
                  <DateTimeField containerStyle={styles.timeField} label="Início" value={startTime} onChange={setStartTime} mode="time" error={startTimeError} />
                  <DateTimeField containerStyle={styles.timeField} label="Término" value={endTime} onChange={setEndTime} mode="time" error={endTimeError} />
                </View>
                <PrimaryInputText label="Local" value={location} onChangeText={setLocation} placeholder="Ex.: Abrigo Kapa, sala de cuidados" erro={locationError} maxLength={200} />
                <PrimaryInputText label="CEP" value={cep} onChangeText={setCep} placeholder="Ex.: 13083000" keyboardType="number-pad" erro={cepError} maxLength={9} />
              </View>
              <View style={styles.card}>
                <Text style={styles.section}>Vagas</Text>
                <PrimaryInputText label="Quantidade de voluntários" value={vacancies} onChangeText={setVacancies} placeholder="Ex.: 4" keyboardType="number-pad" erro={vacanciesError} />
              </View>
              <PrimaryButton title="Cadastrar atividade" loading={saving} onPress={() => void handleSave()} size="lg" />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
