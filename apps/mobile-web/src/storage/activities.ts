import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ActivityType, WeeklyActivity } from '@/types/activity';

const KEY = '@kapa/weekly-activities';

const activityTypes: ActivityType[] = ['care', 'cleaning', 'event', 'transport'];

function isWeeklyActivity(value: unknown): value is WeeklyActivity {
  if (!value || typeof value !== 'object') return false;

  const activity = value as Record<string, unknown>;
  return (
    typeof activity.id === 'string' &&
    typeof activity.title === 'string' &&
    typeof activity.description === 'string' &&
    typeof activity.date === 'string' &&
    typeof activity.startTime === 'string' &&
    typeof activity.endTime === 'string' &&
    typeof activity.location === 'string' &&
    typeof activity.vacancies === 'number' &&
    activityTypes.includes(activity.type as ActivityType) &&
    typeof activity.createdAt === 'string'
  );
}

export async function listWeeklyActivities(): Promise<WeeklyActivity[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isWeeklyActivity)
      .sort((first, second) =>
        `${first.date}T${first.startTime}`.localeCompare(
          `${second.date}T${second.startTime}`,
        ),
      );
  } catch {
    return [];
  }
}

export async function saveWeeklyActivity(
  activity: WeeklyActivity,
): Promise<WeeklyActivity[]> {
  const activities = await listWeeklyActivities();
  const updatedActivities = [...activities, activity].sort((first, second) =>
    `${first.date}T${first.startTime}`.localeCompare(
      `${second.date}T${second.startTime}`,
    ),
  );

  await AsyncStorage.setItem(KEY, JSON.stringify(updatedActivities));
  return updatedActivities;
}
