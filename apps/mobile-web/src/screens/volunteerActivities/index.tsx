import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CalendarBlankIcon,
  MapPinIcon,
  UsersThreeIcon,
} from 'phosphor-react-native';
import { isAxiosError } from 'axios';
import { z } from 'zod';
import type { CommunityEventListItem } from '@kapa/shared';
import { useAuth } from '@/hooks/useAuth';
import { kapaService } from '@/services/kapaService';
import { PrimaryButton } from '@/components/buttons/primary';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { palette, typography } from '@/theme';

const activitySchema = z.object({
  id: z.string().cuid(),
  title: z.string(),
  description: z.string(),
  cep: z.number().int(),
  startAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  isSignedUp: z.boolean(),
  volunteerCount: z.number().int().nonnegative(),
});

const activitiesResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(activitySchema),
});

const activityResponseSchema = z.object({
  success: z.literal(true),
  data: activitySchema,
});

function dataFromError(error: unknown): string {
  if (isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (typeof data === 'object' && data !== null) {
      const body = data as Record<string, unknown>;
      if (typeof body.error === 'string') return body.error;
      if (typeof body.message === 'string') return body.message;
    }
  }
  return 'Não foi possível concluir a solicitação. Tente novamente.';
}

function formatDate(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatCep(cep: number): string {
  const digits = String(cep).padStart(8, '0');
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function VolunteerActivitiesScreen() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<CommunityEventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingId, setSubmittingId] = useState<string>();
  const [error, setError] = useState<string>();
  const [signupError, setSignupError] = useState<string>();

  const fetchActivities = useCallback(async () => {
    const response = await kapaService.get<unknown>('/api/community-events');
    const payload = activitiesResponseSchema.safeParse(response.data);
    if (!payload.success) {
      throw new Error('A resposta de atividades recebida é inválida.');
    }
    return payload.data.data;
  }, []);

  const loadActivities = useCallback(async () => {
    try {
      setActivities(await fetchActivities());
      setError(undefined);
    } catch (requestError) {
      setError(dataFromError(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchActivities]);

  useEffect(() => {
    if (user?.role !== 'volunteer') return;

    let isActive = true;
    void fetchActivities()
      .then((data) => {
        if (isActive) setActivities(data);
      })
      .catch((requestError: unknown) => {
        if (isActive) setError(dataFromError(requestError));
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [fetchActivities, user?.role]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setError(undefined);
    void loadActivities();
  }, [loadActivities]);

  const signUp = useCallback(async (activityId: string) => {
    setSubmittingId(activityId);
    setSignupError(undefined);
    try {
      const response = await kapaService.post<unknown>(
        `/api/community-events/${activityId}/volunteers`,
      );
      const payload = activityResponseSchema.safeParse(response.data);
      if (!payload.success) {
        throw new Error('A resposta de inscrição recebida é inválida.');
      }
      setActivities((current) =>
        current.map((activity) =>
          activity.id === activityId
            ? payload.data.data
            : activity,
        ),
      );
    } catch (requestError) {
      setSignupError(dataFromError(requestError));
    } finally {
      setSubmittingId(undefined);
    }
  }, []);

  if (user?.role !== 'volunteer') {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <View style={styles.messageState}>
          <Text style={styles.title}>Área de voluntariado</Text>
          <Text style={styles.subtitle}>
            Esta área está disponível somente para contas de voluntário.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Atividades</Text>
          <Text style={styles.subtitle}>
            Encontre uma forma de ajudar os animais e a equipe do abrigo.
          </Text>
        </View>

        <ErrorBanner message={error} />
        <ErrorBanner message={signupError} />

        {loading ? (
          <View style={styles.messageState}>
            <ActivityIndicator size="large" color={palette.orange} />
            <Text style={styles.stateText}>Buscando atividades...</Text>
          </View>
        ) : null}

        {!loading && !error && activities.length === 0 ? (
          <View style={styles.messageState}>
            <CalendarBlankIcon size={36} color={palette.denim} />
            <Text style={styles.emptyTitle}>Nenhuma atividade disponível</Text>
            <Text style={styles.stateText}>
              Quando uma nova atividade for cadastrada, ela aparecerá aqui.
            </Text>
          </View>
        ) : null}

        {activities.map((activity) => (
          <View key={activity.id} style={styles.card}>
            <View style={styles.cardHeading}>
              <Text style={styles.cardTitle}>{activity.title}</Text>
              {activity.isSignedUp ? (
                <View style={styles.registeredBadge}>
                  <Text style={styles.registeredText}>Inscrito</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.description}>{activity.description}</Text>

            <View style={styles.metadataRow}>
              <CalendarBlankIcon size={19} color={palette.denim} />
              <Text style={styles.metadata}>{formatDate(activity.startAt)}</Text>
            </View>
            <View style={styles.metadataRow}>
              <MapPinIcon size={19} color={palette.denim} />
              <Text style={styles.metadata}>CEP {formatCep(activity.cep)}</Text>
            </View>
            <View style={styles.metadataRow}>
              <UsersThreeIcon size={19} color={palette.denim} />
              <Text style={styles.metadata}>
                {activity.volunteerCount}{' '}
                {activity.volunteerCount === 1 ? 'voluntário inscrito' : 'voluntários inscritos'}
              </Text>
            </View>

            <PrimaryButton
              title={activity.isSignedUp ? 'Inscrição confirmada' : 'Quero participar'}
              disabled={activity.isSignedUp || submittingId === activity.id}
              loading={submittingId === activity.id}
              onPress={() => void signUp(activity.id)}
              accessibilityLabel={
                activity.isSignedUp
                  ? `Inscrição confirmada para ${activity.title}`
                  : `Inscrever-se em ${activity.title}`
              }
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.cream },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 18,
  },
  header: { gap: 8, marginBottom: 4 },
  title: { ...typography.styles.headlineLgMobile, color: palette.ink },
  subtitle: { ...typography.styles.bodyMd, color: palette.inkMuted },
  card: {
    backgroundColor: palette.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 16,
    gap: 14,
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    ...typography.styles.headlineMd,
    color: palette.denim,
    flex: 1,
  },
  registeredBadge: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#E8F3EE',
  },
  registeredText: {
    ...typography.styles.labelSm,
    color: palette.success,
  },
  description: { ...typography.styles.bodySm, color: palette.inkMuted },
  metadataRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metadata: { ...typography.styles.bodySm, color: palette.ink, flex: 1 },
  messageState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 44,
    paddingHorizontal: 12,
  },
  emptyTitle: { ...typography.styles.headlineMd, color: palette.ink },
  stateText: {
    ...typography.styles.bodySm,
    color: palette.inkMuted,
    textAlign: 'center',
  },
});
