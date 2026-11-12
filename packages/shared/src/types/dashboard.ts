import type { AdoptionStatus } from './adoption';
import type {
  AnimalStatus,
  Conditions,
  ShelterBudgetPrediction,
  Species,
} from './animal';
import type { SystemEventTypes } from './event';
import type { UserRole } from './user';

export interface DashboardAnimalMetrics {
  total: number;
  activeInShelter: number;
  byStatus: Record<AnimalStatus, number>;
  bySpecies: Record<Species, number>;
  activeByCondition: Record<Conditions, number>;
  activeVaccinatedCount: number;
  activeCastratedCount: number;
  totalFavoritesCount: number;
}

export interface DashboardAdoptionMetrics {
  total: number;
  byStatus: Record<AdoptionStatus, number>;
  approvalRatePercent: number;
}

export interface DashboardVolunteerMetrics {
  pendingApplicationsCount: number;
  approvedApplicationsCount: number;
  rejectedApplicationsCount: number;
  upcomingEventsCount: number;
  upcomingVolunteerSignupsCount: number;
  upcomingTotalVacancies: number;
}

export interface DashboardUserMetrics {
  totalActive: number;
  deactivatedCount: number;
  byRole: Record<UserRole, number>;
}

export interface DashboardRecentEventItem {
  id: string;
  type: SystemEventTypes;
  emittedAt: string;
  userName?: string | null;
  animalName?: string | null;
}

export interface ShelterDashboardSummary {
  generatedAt: string;
  animals: DashboardAnimalMetrics;
  adoptions: DashboardAdoptionMetrics;
  volunteers: DashboardVolunteerMetrics;
  users: DashboardUserMetrics;
  budgetPrediction: ShelterBudgetPrediction;
  recentEvents: DashboardRecentEventItem[];
}
