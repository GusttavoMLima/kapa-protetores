export type ActivityType = 'care' | 'cleaning' | 'event' | 'transport';

export interface WeeklyActivity {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  vacancies: number;
  type: ActivityType;
  createdAt: string;
}
