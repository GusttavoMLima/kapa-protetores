import { useEffect, useState } from 'react';
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
import { DefaultHeader } from '@/components/header/default';
import { PrimaryButton } from '@/components/buttons/primary';
import { PrimaryChipGroup } from '@/components/chips/primaryChip';
import { DateTimeField } from '@/components/inputDateTime';
import { PrimaryInputText } from '@/components/inputText/primary';
import { listWeeklyActivities, saveWeeklyActivity } from '@/storage/activities';
import type { ActivityType, WeeklyActivity } from '@/types/activity';
import { palette } from '@/theme';
import { styles } from './styles';

type Feedback = { kind: 'success' | 'error'; message: string } | undefined;

const activityTypeOptions: { value: ActivityType; label: string }[] = [
  { value: 'care', label: 'Cuidados' },
  { value: 'cleaning', label: 'Limpeza' },
  { value: 'event', label: 'Evento' },
  { value: 'transport', label: 'Transporte' },
];

const activityTypeLabels: Record<ActivityType, string> = {
  care: 'Cuidados',
  cleaning: 'Limpeza',
  event: 'Evento',
  transport: 'Transporte',
};

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDate(value: string): string {
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export function ActivitiesScreen() {
  const { user } = useAuth();
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [activities, setActivities] = useState<WeeklyActivity[]>([]);
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
  const [vacancies, setVacancies] = useState('');
  const [type, setType] = useState<ActivityType>('care');

  const canManageActivities = user?.role === 'admin' || user?.role === 'protector';
  const titleError = attempted && !title.trim() ? 'Informe o título da atividade.' : undefined;
  const dateError = attempted && !/^\d{4}-\d{2}-\d{2}$/.test(date) ? 'Use o formato AAAA-MM-DD.' : undefined;
  const startTimeError = attempted && !/^\d{2}:\d{2}$/.test(startTime) ? 'Use o formato HH:MM.' : undefined;
  const vacanciesError = attempted && (!Number.isInteger(Number(vacancies)) || Number(vacancies) < 1)
    ? 'Informe pelo menos uma vaga.'
    : undefined;

  useEffect(() => {
    async function loadActivities() {
      try {
        setActivities(await listWeeklyActivities());
      } catch {
        setFeedback({ kind: 'error', message: 'Não foi possível carregar as atividades.' });
      } finally {
        setLoading(false);
      }
    }

    void loadActivities();
  }, []);

  function resetForm() {
    setTitle('');
    setDescription('');
    setDate('');
    setStartTime('');
    setEndTime('');
    setLocation('');
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

    if (titleError || dateError || startTimeError || vacanciesError) return;

    setSaving(true);
    try {
      const updatedActivities = await saveWeeklyActivity({
        id: createId(),
        title: title.trim(),
        description: description.trim(),
        date,
        startTime,
        endTime,
        location: location.trim(),
        vacancies: Number(vacancies),
        type,
        createdAt: new Date().toISOString(),
      });
      setActivities(updatedActivities);
      resetForm();
      setMode('list');
      setFeedback({ kind: 'success', message: 'Atividade cadastrada para a semana.' });
    } catch {
      setFeedback({ kind: 'error', message: 'Não foi possível salvar a atividade. Tente novamente.' });
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
                        <Text style={styles.vacancies}>{activity.vacancies} {activity.vacancies === 1 ? 'vaga' : 'vagas'}</Text>
                      </View>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      {activity.description ? <Text style={styles.activityDescription}>{activity.description}</Text> : null}
                      <View style={styles.activityDetails}>
                        <View style={styles.detail}><CalendarIcon size={18} color={palette.denim} /><Text style={styles.detailText}>{formatDate(activity.date)}</Text></View>
                        <View style={styles.detail}><ClockIcon size={18} color={palette.denim} /><Text style={styles.detailText}>{activity.startTime}{activity.endTime ? ` às ${activity.endTime}` : ''}</Text></View>
                        {activity.location ? <View style={styles.detail}><MapPinIcon size={18} color={palette.denim} /><Text style={styles.detailText}>{activity.location}</Text></View> : null}
                        <View style={styles.detail}><UsersThreeIcon size={18} color={palette.denim} /><Text style={styles.detailText}>Aguardando inscrições</Text></View>
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
                <PrimaryInputText label="Título" value={title} onChangeText={setTitle} placeholder="Ex.: Passeio com os cães" erro={titleError} />
                <PrimaryInputText label="Descrição" value={description} onChangeText={setDescription} placeholder="Explique o que será feito e o que levar" multiline />
                <Text style={styles.fieldLabel}>Tipo de ajuda</Text>
                <PrimaryChipGroup options={activityTypeOptions} value={type} onChange={setType} />
              </View>
              <View style={styles.card}>
                <Text style={styles.section}>Quando e onde</Text>
                <DateTimeField label="Data" value={date} onChange={setDate} mode="date" error={dateError} />
                <View style={styles.timeRow}>
                  <DateTimeField containerStyle={styles.timeField} label="Início" value={startTime} onChange={setStartTime} mode="time" error={startTimeError} />
                  <DateTimeField containerStyle={styles.timeField} label="Término" value={endTime} onChange={setEndTime} mode="time" />
                </View>
                <PrimaryInputText label="Local" value={location} onChangeText={setLocation} placeholder="Ex.: Abrigo Kapa, sala de cuidados" />
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
